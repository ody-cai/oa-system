# 更新日志 | Changelog

All notable changes to this project will be documented in this file.

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
