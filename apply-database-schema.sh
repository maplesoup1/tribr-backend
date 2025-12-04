#!/bin/bash

# 一键应用数据库 Schema
# 使用 Prisma db push 方式，适合已有数据库的情况

set -e

echo "🚀 Tribr 数据库 Schema 应用程序"
echo "================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ 错误: 未找到 prisma/schema.prisma"
  echo "请在 tribr-backend 目录下运行此脚本"
  exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
  echo "⚠️  警告: 未找到 .env 文件"
  echo "请根据 .env.example 创建 .env 文件"
  exit 1
fi

echo "📋 将执行以下操作:"
echo "  1. 加载环境变量"
echo "  2. 生成 Prisma Client"
echo "  3. 将 schema 同步到数据库 (db push)"
echo "  4. 创建必要的约束和索引"
echo ""

read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 已取消"
  exit 0
fi

echo ""
echo "步骤 1/3: 生成 Prisma Client..."
npx prisma generate

echo ""
echo "步骤 2/3: 同步 Schema 到数据库..."
echo "  这将创建所有新表和关系..."

# 使用 db push 而不是 migrate，因为现有数据库可能有 drift
npx prisma db push --skip-generate

echo ""
echo "步骤 3/3: 应用额外的 SQL 配置..."
echo "  (PostGIS, 触发器, RLS 需要手动在 Supabase Dashboard 执行)"
echo ""

echo "✅ Schema 同步完成！"
echo ""
echo "⚠️  重要提醒:"
echo ""
echo "以下步骤需要在 Supabase Dashboard 手动完成:"
echo ""
echo "1. 启用 PostGIS 扩展 (Database → Extensions)"
echo "   - 找到并启用 'postgis'"
echo ""
echo "2. 启用 Realtime (Database → Replication)"
echo "   - 勾选以下表:"
echo "     ☐ messages"
echo "     ☐ user_locations"
echo "     ☐ connections"
echo "     ☐ conversation_participants"
echo "     ☐ conversations"
echo ""
echo "3. 执行额外的 SQL (SQL Editor)"
echo "   文件位置: prisma/migrations/"
echo "   - 01_add_constraints.sql  (约束和索引)"
echo "   - 02_triggers.sql         (触发器)"
echo "   - 04_row_level_security.sql (RLS 策略)"
echo "   - 05_migrate_user_data.sql  (数据迁移)"
echo ""
echo "详细步骤请查看: MANUAL_MIGRATION_GUIDE.md"
echo ""
echo "🎉 完成！运行 'npm run start:dev' 启动服务器"
