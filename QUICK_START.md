# 🚀 数据库迁移快速开始

## 选择你的方式

### 方式 A: 一键脚本（最快）✨

```bash
cd tribr-backend
./apply-database-schema.sh
```

然后在 Supabase Dashboard 完成剩余步骤（脚本会提示）

---

### 方式 B: Prisma 命令

```bash
cd tribr-backend

# 1. 生成 Prisma Client
npx prisma generate

# 2. 同步 Schema 到数据库
npx prisma db push

# 3. 在 Supabase Dashboard 执行额外 SQL
# 见下方 "Supabase Dashboard 步骤"
```

---

### 方式 C: 完全手动

查看详细指南：[MANUAL_MIGRATION_GUIDE.md](./MANUAL_MIGRATION_GUIDE.md)

---

## Supabase Dashboard 必做步骤

无论选择哪种方式，都需要在 Supabase Dashboard 完成以下配置：

### 1. 启用 PostGIS 扩展

```
Dashboard → Database → Extensions
找到 "postgis" → 点击启用
```

### 2. 启用 Realtime

```
Dashboard → Database → Replication
找到 "supabase_realtime" publication
勾选以下表:
  ☑️ messages
  ☑️ user_locations
  ☑️ connections
  ☑️ conversation_participants
  ☑️ conversations
```

### 3. 执行额外 SQL

```
Dashboard → SQL Editor → New Query
按顺序复制粘贴并执行以下文件:
  1. prisma/migrations/01_add_constraints.sql
  2. prisma/migrations/02_triggers.sql
  3. prisma/migrations/04_row_level_security.sql
  4. prisma/migrations/05_migrate_user_data.sql
```

---

## 验证迁移成功 ✅

```bash
# 1. 检查 Prisma Client
npx prisma generate

# 2. 打开 Prisma Studio 查看数据
npx prisma studio

# 3. 启动应用测试
npm run start:dev
```

访问: `http://localhost:3000/users/me`

如果返回用户数据（包含 profile），说明成功！🎉

---

## 故障排查 🔧

### 问题: "Can't reach database server"

**解决**: 检查 `.env` 文件中的 `DIRECT_URL` 是否正确

```bash
# .env 文件应包含:
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...supabase.com:5432/postgres"
```

### 问题: "Table already exists"

**解决**: 这是正常的，`db push` 会跳过已存在的表

### 问题: RLS 阻止查询

**解决**: 确保已执行 `04_row_level_security.sql`

---

## 下一步

✅ 数据库迁移完成后:

1. **更新 Users Service** - 使用新的 `profile` 关系
2. **创建新的 Services**:
   - ConnectionsService (社交连接)
   - MessagesService (消息)
   - ConversationsService (会话)
   - JourneysService (旅程)
   - LocationsService (位置)
3. **前端集成 Realtime** - 订阅消息和位置更新

查看完整实现指南: [DATABASE_IMPLEMENTATION_SUMMARY.md](./DATABASE_IMPLEMENTATION_SUMMARY.md)

---

## 文件索引

| 文件 | 用途 |
|------|------|
| `apply-database-schema.sh` | 一键执行脚本 |
| `QUICK_START.md` | 本文件 - 快速开始 |
| `MANUAL_MIGRATION_GUIDE.md` | 详细手动迁移指南 |
| `DATABASE_IMPLEMENTATION_SUMMARY.md` | 完整实现总结 |
| `prisma/migrations/README.md` | 迁移文件说明 |
| `prisma/schema.prisma` | 数据库 Schema |

---

需要帮助? 参考上述文档或查看 [Prisma 文档](https://www.prisma.io/docs)
