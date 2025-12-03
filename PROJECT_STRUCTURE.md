# Tribr Backend 项目结构说明

## 整体架构

本项目采用 NestJS 模块化架构，按照业务功能划分模块，遵循单一职责原则和依赖注入模式。

## 目录结构

```
tribr-backend/
│
├── prisma/                          # Prisma ORM 配置和迁移
│   ├── schema.prisma               # 数据模型定义
│   └── migrations/                 # 数据库迁移历史
│
├── src/                            # 源代码目录
│   │
│   ├── modules/                    # 业务模块目录
│   │   │
│   │   ├── auth/                   # 认证模块
│   │   │   ├── auth.module.ts     # 模块定义
│   │   │   ├── auth.service.ts    # 业务逻辑（OTP、JWT）
│   │   │   ├── auth.controller.ts # HTTP 控制器
│   │   │   ├── dto/               # 数据传输对象
│   │   │   │   ├── send-otp.dto.ts
│   │   │   │   ├── verify-otp.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── strategies/        # Passport 策略
│   │   │       ├── jwt.strategy.ts
│   │   │       └── jwt-refresh.strategy.ts
│   │   │
│   │   ├── users/                  # 用户管理模块
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts   # 用户 CRUD 操作
│   │   │   ├── users.controller.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── onboarding/             # 新用户引导模块
│   │   │   ├── onboarding.module.ts
│   │   │   ├── onboarding.service.ts # 步骤管理和进度跟踪
│   │   │   ├── onboarding.controller.ts
│   │   │   └── dto/
│   │   │       ├── set-archetype.dto.ts
│   │   │       ├── set-interests.dto.ts
│   │   │       └── create-journey.dto.ts
│   │   │
│   │   ├── profile/                # 用户档案模块
│   │   │   ├── profile.module.ts
│   │   │   ├── profile.service.ts # 档案管理、头像上传
│   │   │   ├── profile.controller.ts
│   │   │   └── dto/
│   │   │       └── update-profile.dto.ts
│   │   │
│   │   ├── storage/                # 文件存储模块
│   │   │   ├── storage.module.ts
│   │   │   ├── storage.service.ts # Supabase Storage 集成
│   │   │   ├── storage.controller.ts
│   │   │   └── dto/
│   │   │       └── upload-file.dto.ts
│   │   │
│   │   └── notifications/          # 通知服务模块
│   │       ├── notifications.module.ts
│   │       ├── notifications.service.ts # SMS/Push 发送
│   │       ├── notifications.controller.ts
│   │       └── dto/
│   │           └── send-notification.dto.ts
│   │
│   ├── common/                     # 共享组件
│   │   │
│   │   ├── decorators/            # 自定义装饰器
│   │   │   ├── current-user.decorator.ts  # 获取当前用户
│   │   │   ├── public.decorator.ts        # 公开路由标记
│   │   │   └── roles.decorator.ts         # 角色权限
│   │   │
│   │   ├── filters/               # 异常过滤器
│   │   │   ├── http-exception.filter.ts   # HTTP 异常处理
│   │   │   └── prisma-exception.filter.ts # Prisma 异常处理
│   │   │
│   │   ├── guards/                # 守卫
│   │   │   ├── jwt-auth.guard.ts          # JWT 认证守卫
│   │   │   └── roles.guard.ts             # 角色权限守卫
│   │   │
│   │   ├── interceptors/          # 拦截器
│   │   │   ├── transform.interceptor.ts   # 响应转换
│   │   │   └── logging.interceptor.ts     # 日志记录
│   │   │
│   │   ├── pipes/                 # 管道
│   │   │   └── validation.pipe.ts         # 全局验证管道
│   │   │
│   │   └── dto/                   # 通用 DTO
│   │       ├── pagination.dto.ts          # 分页参数
│   │       └── response.dto.ts            # 统一响应格式
│   │
│   ├── prisma/                     # Prisma 数据库模块
│   │   ├── prisma.module.ts       # 全局模块
│   │   └── prisma.service.ts      # Prisma Client 服务
│   │
│   ├── config/                     # 配置模块
│   │   └── config.ts              # 环境变量配置
│   │
│   ├── app.module.ts              # 根模块
│   └── main.ts                    # 应用入口
│
├── test/                           # 测试文件
│   ├── app.e2e-spec.ts           # E2E 测试
│   └── jest-e2e.json             # E2E 测试配置
│
├── .env                           # 环境变量（不提交到版本控制）
├── .env.example                   # 环境变量模板
├── prisma.config.ts               # Prisma 配置文件
├── tsconfig.json                  # TypeScript 配置
├── nest-cli.json                  # NestJS CLI 配置
└── package.json                   # 项目依赖
```

## 模块职责详解

### 1. AuthModule（认证模块）
**核心职责**：
- OTP 验证码生成和验证
- JWT 令牌签发和刷新
- 用户登录状态管理

**关键文件**：
- `auth.service.ts`: 实现 OTP 生成、验证逻辑，JWT 签发
- `jwt.strategy.ts`: JWT 认证策略，从 token 中提取用户信息
- `auth.controller.ts`: 暴露登录、刷新等 API 端点

**数据流**：
1. 用户请求发送 OTP → 生成 6 位数字码 → 存入数据库（带过期时间）
2. 用户提交 OTP → 验证码校验 → 生成 JWT access & refresh token
3. 后续请求携带 JWT → Guard 验证 → 提取用户信息 → 注入到请求上下文

### 2. UsersModule（用户模块）
**核心职责**：
- 用户基础信息的 CRUD
- 用户状态管理（onboardingComplete 等）

**关键文件**：
- `users.service.ts`: 用户数据库操作，通过 PrismaService 进行
- `users.controller.ts`: 用户信息查询、更新接口

### 3. OnboardingModule（引导模块）
**核心职责**：
- 新用户引导流程的状态机管理
- 步骤顺序控制和进度追踪

**流程设计**：
```
ACCOUNT → VERIFY_PHONE → PHOTO → ARCHETYPE → INTERESTS → JOURNEY → COMPLETE
```

**关键逻辑**：
- 每次提交步骤数据时更新 `OnboardingProgress` 表
- 确保步骤顺序（不能跳过）
- 完成所有步骤后设置 `user.onboardingComplete = true`

### 4. ProfileModule（档案模块）
**核心职责**：
- 用户档案信息管理（bio、archetypes、interests）
- 头像上传和管理

**与 StorageModule 的协作**：
- 调用 StorageModule 上传头像
- 保存返回的 URL 到 `Profile.photoUrl`

### 5. StorageModule（存储模块）
**核心职责**：
- 文件上传到 Supabase Storage
- 生成预签名 URL 供客户端直接上传
- 文件访问权限管理

**设计模式**：
- 抽象层：定义统一的 `IStorageService` 接口
- 实现层：`SupabaseStorageService` 实现具体逻辑
- 未来可轻松切换到 S3 或其他云存储

### 6. NotificationModule（通知模块）
**核心职责**：
- SMS 短信发送（用于 OTP）
- Push 推送通知
- 应用内通知管理

**扩展性**：
- 定义 `INotificationProvider` 接口
- 支持多个通知渠道的插件式集成

## 数据流示例

### 用户注册和引导完整流程

```
1. 前端：POST /auth/send-otp { phone: "+1234567890" }
   后端：生成 OTP → 存入 otp_codes 表 → 调用 NotificationService 发送短信

2. 前端：POST /auth/verify-otp { phone: "+1234567890", code: "123456" }
   后端：验证 OTP → 创建/查找 User → 生成 JWT tokens → 返回

3. 前端：POST /onboarding/archetype { archetypes: ["adventurer"] }
   后端（携带 JWT）：
     - Guard 验证 JWT → 提取 userId
     - 更新 Profile.archetypes
     - 更新 OnboardingProgress.currentStep = INTERESTS
     - 返回进度

4. 前端：POST /onboarding/interests { interests: ["hiking", "beach"] }
   后端：同样流程，推进到下一步

5. 前端：POST /onboarding/journey { destination: "Bali", ... }
   后端：
     - 创建 Journey 记录
     - 更新 OnboardingProgress.currentStep = COMPLETE
     - 设置 User.onboardingComplete = true

6. 前端：此后可正常使用所有需要认证的功能
```

## 技术决策

### 为什么使用 Prisma？
- **类型安全**：自动生成 TypeScript 类型
- **迁移管理**：版本化的数据库变更
- **查询构建器**：直观的 API，减少 SQL 错误
- **关系处理**：自动处理外键和级联操作

### 为什么分离 DatabaseModule 和业务 Module？
- **关注点分离**：数据库连接管理与业务逻辑解耦
- **可测试性**：业务模块可轻松 mock PrismaService
- **全局共享**：@Global 装饰器使所有模块都能注入 PrismaService

### 为什么使用 JWT 而非 Session？
- **无状态**：适合分布式部署和负载均衡
- **移动友好**：客户端存储 token，无需 cookie
- **性能**：减少服务器端存储和查询

### 为什么需要 Refresh Token？
- **安全性**：Access Token 短期有效（15分钟），减少泄露风险
- **用户体验**：Refresh Token 长期有效（7天），避免频繁登录
- **可控性**：可单独撤销 Refresh Token，踢出用户

## 下一步开发计划

### 第一阶段（基础功能）
1. ✅ 项目初始化和数据库设计
2. ⏳ 实现 AuthModule
3. ⏳ 实现 UsersModule
4. ⏳ 实现 OnboardingModule

### 第二阶段（核心功能）
5. 实现 ProfileModule
6. 实现 StorageModule
7. 实现 NotificationModule

### 第三阶段（完善与优化）
8. 配置 Swagger API 文档
9. 添加单元测试和 E2E 测试
10. 性能优化和缓存策略
11. 错误处理和日志系统
12. Docker 容器化和 CI/CD

## 编码规范

### 命名约定
- **文件名**：kebab-case（如 `auth.service.ts`）
- **类名**：PascalCase（如 `AuthService`）
- **方法名**：camelCase（如 `sendOtp`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_ATTEMPTS`）

### DTO 设计原则
- 使用 class-validator 装饰器进行验证
- 每个 DTO 对应一个特定的 API 端点
- 输入 DTO 和输出 DTO 分离（CreateUserDto vs UserResponseDto）

### 错误处理
- 使用 NestJS 内置异常类（`NotFoundException`, `BadRequestException` 等）
- 业务错误抛出语义化的异常
- 统一由 ExceptionFilter 捕获和格式化

### 数据库事务
- 使用 Prisma 的 `$transaction` API
- 关键操作（如引导完成）确保原子性
- 避免长事务，及时提交

## 常见问题

### Q: 如何添加新的 API 端点？
1. 在对应模块的 `controller.ts` 中添加新方法
2. 使用装饰器定义路由（`@Get`, `@Post` 等）
3. 在 `service.ts` 中实现业务逻辑
4. 创建对应的 DTO 进行参数验证

### Q: 如何保护需要认证的路由？
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-route')
async protectedRoute(@CurrentUser() user: User) {
  return { message: 'This is protected', user };
}
```

### Q: 如何处理 Prisma 的唯一约束冲突？
```typescript
try {
  await this.prisma.user.create({ data: { phone } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('Phone number already exists');
    }
  }
  throw error;
}
```

## 贡献指南

1. 拉取最新代码
2. 创建功能分支（`feature/your-feature-name`）
3. 编写代码并确保测试通过
4. 提交 PR 并等待 Code Review
5. 合并到主分支

---

**最后更新**: 2025-12-03
**维护者**: Tribr Development Team
