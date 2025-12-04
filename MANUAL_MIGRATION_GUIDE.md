# 手动迁移指南

由于自动迁移遇到连接问题，以下是手动应用数据库迁移的步骤。

## 前提条件

确保你的 `.env` 文件中配置了正确的数据库连接：

```env
# Direct connection (用于迁移)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Pooled connection (用于应用运行)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 方法 1：通过 Supabase Dashboard（最简单）

### 步骤：

1. **登录 Supabase Dashboard**
   - 访问：https://app.supabase.com
   - 选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New Query"

3. **按顺序执行以下 SQL 文件**：

#### Step 1: 启用 PostGIS
```sql
-- 复制并执行 prisma/migrations/00_enable_postgis.sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_version();
```

#### Step 2: 创建所有枚举类型
```sql
-- 创建枚举
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'email');
CREATE TYPE "Visibility" AS ENUM ('public', 'connections', 'private');
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'accepted');
CREATE TYPE "ConversationType" AS ENUM ('dm', 'group');
CREATE TYPE "ParticipantRole" AS ENUM ('owner', 'admin', 'member');
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'journey', 'system');
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'declined');
```

#### Step 3: 使用 Prisma db push（推荐）

如果数据库连接正常，直接运行：

```bash
cd tribr-backend
npx prisma db push
```

这将：
- ✅ 创建所有新表
- ✅ 添加外键关系
- ✅ 自动处理现有 users 表

#### Step 4: 创建用户 Profiles

```sql
-- 从现有 users 数据创建 profiles
INSERT INTO profiles (
  user_id,
  full_name,
  avatar_url,
  visibility,
  verification_level,
  archetypes,
  interests,
  bio
)
SELECT
  id,
  full_name,
  photo_url,
  'public'::visibility,
  0,
  archetypes,
  interests,
  bio
FROM users
WHERE full_name IS NOT NULL OR photo_url IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
```

#### Step 5: 添加约束和索引

```sql
-- 复制并执行 prisma/migrations/01_add_constraints.sql
-- connections 表约束
ALTER TABLE connections
ADD CONSTRAINT check_user_a_less_than_user_b
CHECK ("userA" < "userB");

-- 空间索引
CREATE INDEX IF NOT EXISTS idx_user_locations_geo
ON user_locations USING GIST(location);

-- 消息索引
CREATE INDEX IF NOT EXISTS idx_messages_active
ON messages(conversation_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 连接索引
CREATE INDEX IF NOT EXISTS idx_connections_status
ON connections(status)
WHERE status = 'accepted';

-- 邀请索引
CREATE INDEX IF NOT EXISTS idx_invites_pending_expired
ON conversation_invites(status, expires_at)
WHERE status = 'pending' AND expires_at IS NOT NULL;
```

#### Step 6: 创建触发器

```sql
-- 复制并执行 prisma/migrations/02_triggers.sql
-- (完整 SQL 见文件)
```

#### Step 7: 启用 Realtime

```sql
-- 方式 A: 通过 Dashboard UI
-- 1. 进入 Database → Replication
-- 2. 找到 supabase_realtime publication
-- 3. 勾选以下表：
--    ✅ messages
--    ✅ user_locations
--    ✅ connections
--    ✅ conversation_participants
--    ✅ conversations

-- 方式 B: 通过 SQL
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

#### Step 8: 配置 RLS（重要！）

```sql
-- 复制并执行 prisma/migrations/04_row_level_security.sql
-- (完整 SQL 见文件，包含所有表的 RLS 策略)
```

---

## 方法 2：使用 Prisma Studio 验证

迁移完成后，检查数据：

```bash
npx prisma studio
```

这将打开图形界面，你可以：
- 查看所有表
- 检查数据完整性
- 验证关系是否正确

---

## 方法 3：使用 psql 命令行

如果你有 psql 安装：

```bash
# 获取数据库连接字符串（从 Supabase Dashboard → Settings → Database）
export DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# 依次执行迁移文件
psql $DB_URL -f prisma/migrations/00_enable_postgis.sql
psql $DB_URL -c "npx prisma db push"
psql $DB_URL -f prisma/migrations/01_add_constraints.sql
psql $DB_URL -f prisma/migrations/02_triggers.sql
psql $DB_URL -f prisma/migrations/03_enable_realtime.sql
psql $DB_URL -f prisma/migrations/04_row_level_security.sql
psql $DB_URL -f prisma/migrations/05_migrate_user_data.sql
```

---

## 验证迁移成功

### 1. 检查所有表是否创建

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**应该看到：**
- ✅ users
- ✅ user_identities
- ✅ profiles
- ✅ connections
- ✅ journeys
- ✅ user_blocks
- ✅ conversations
- ✅ conversation_participants
- ✅ conversation_invites
- ✅ messages
- ✅ user_locations

### 2. 验证 PostGIS

```sql
SELECT PostGIS_version();
```

### 3. 检查 Realtime Publication

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

### 4. 测试 RLS 策略

```sql
-- 设置测试用户
SET request.jwt.claims.sub = 'your-user-uuid';

-- 测试查询（应该只看到该用户的数据）
SELECT * FROM messages;
SELECT * FROM user_locations;
```

---

## 常见问题

### Q1: "relation already exists" 错误

**原因**: 表已存在

**解决**:
```sql
-- 跳过该表，或者删除后重新创建
DROP TABLE IF EXISTS table_name CASCADE;
```

### Q2: "type already exists" 错误

**原因**: 枚举类型已存在

**解决**:
```sql
-- 跳过，或删除后重新创建
DROP TYPE IF EXISTS AuthProvider CASCADE;
```

### Q3: PostGIS 扩展安装失败

**原因**: Supabase 某些区域可能没有预装 PostGIS

**解决**: 在 Supabase Dashboard → Database → Extensions 中启用

### Q4: RLS 策略冲突

**原因**: 同名策略已存在

**解决**:
```sql
-- 先删除旧策略
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## 迁移后步骤

### 1. 重新生成 Prisma Client

```bash
npx prisma generate
```

### 2. 更新 Users Service

修改 `src/modules/users/users.service.ts`:

```typescript
// 旧代码
const user = await this.prisma.user.findUnique({
  where: { id }
});

// 新代码（包含 profile）
const user = await this.prisma.user.findUnique({
  where: { id },
  include: { profile: true }
});
```

### 3. 测试应用

```bash
npm run start:dev
```

检查：
- ✅ 服务器启动无错误
- ✅ `/users/me` 接口返回正常
- ✅ Profile 数据正确关联

---

## 需要帮助？

查看详细文档：
- [DATABASE_IMPLEMENTATION_SUMMARY.md](./DATABASE_IMPLEMENTATION_SUMMARY.md)
- [prisma/migrations/README.md](./prisma/migrations/README.md)

或参考 Prisma 官方文档：
- https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate
