# 更新日志 | Changelog

All notable changes to this project will be documented in this file.

---

## [1.1.0] - 2025-05-30

### 新增功能 | Added

- **云存储仓库系统** - 支持三种仓库类型
  - 公共仓库：所有人可见
  - 私人仓库：仅自己可见
  - 群组仓库：通过邀请加入，支持成员管理
- **仓库成员管理** - 群组仓库支持邀请成员、设置角色（管理员/普通成员）、移除成员
- **文件仓库关联** - 文件可关联到指定仓库，支持按仓库过滤

### 数据库变更 | Database

- 新增 `repositories` 表 - 存储仓库信息
- 新增 `repository_members` 表 - 存储群组仓库成员
- 新增 `repository_invitations` 表 - 存储邀请记录
- `files` 表新增 `repository_id` 字段 - 关联仓库

### API 接口 | API

- `GET /api/repositories` - 获取仓库列表
- `POST /api/repositories` - 创建仓库
- `GET /api/repositories/{id}` - 获取仓库详情
- `PATCH /api/repositories/{id}` - 更新仓库
- `DELETE /api/repositories/{id}` - 删除仓库
- `GET /api/repositories/{id}/members` - 获取成员列表
- `POST /api/repositories/{id}/members` - 邀请成员
- `PATCH /api/repositories/{id}/members` - 更新成员角色
- `DELETE /api/repositories/{id}/members` - 移除成员

### 页面更新 | Pages

- 新增仓库列表页面 `/dashboard/repositories`
- 新增仓库成员管理页面 `/dashboard/repositories/{id}/members`
- 更新文件管理页面支持仓库过滤
- 侧边栏导航新增"云存储仓库"入口

---

## [1.0.0] - 2025-05-30

### 新增功能 | Added

- **用户认证系统** - 登录功能，支持管理员/普通员工角色权限
- **文件管理** - 文件上传、下载、预览、删除功能，支持文件夹管理
- **存储配额** - 用户独立存储空间管理，默认10GB，管理员无限制
- **公告管理** - 企业公告发布、置顶功能
- **站内即时通讯** - 用户间实时消息，支持已读回执和在线状态
- **用户管理** - 管理员可管理用户账号、调整存储配额
- **仪表盘** - 文件统计、最新公告、快捷操作入口

### 技术实现 | Technical

- Next.js 16 + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui 组件库
- Supabase PostgreSQL 数据库
- S3 兼容对象存储
- bcrypt 密码加密

### 开源准备 | Open Source

- 添加中英双语 README.md 文档
- 添加 .env.example 环境变量模板
- 数据脱敏处理，移除敏感信息
- GitHub 仓库创建与代码推送

---

## 版本说明 | Version Notes

- **主版本号 (Major)**: 重大架构变更或不兼容更新
- **次版本号 (Minor)**: 新增功能，向下兼容
- **修订号 (Patch)**: Bug 修复，向下兼容

---

> 仓库地址 | Repository: https://github.com/ody-cai/oa-system
