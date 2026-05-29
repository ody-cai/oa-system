# AGENTS.md

## 项目概览

OA办公自动化系统，集成云存储功能，支持文件管理、公告发布等核心办公功能。

### 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI Components**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Storage**: S3 兼容对象存储

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # 后端API路由
│   │   ├── login/          # 登录页面
│   │   └── dashboard/      # 仪表盘及子页面
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── storage/            # 数据存储
│       └── database/       # 数据库客户端
└── next.config.ts          # Next.js 配置
```

## 构建和测试命令

```bash
# 开发环境
pnpm dev

# 代码检查
pnpm lint
pnpm ts-check

# 构建
pnpm build

# 生产环境
pnpm start
```

## 核心功能模块

### 1. 用户认证
- 登录接口: `POST /api/auth/login`
- 用户信息存储在 localStorage
- 路由保护：dashboard 页面需要登录

### 2. 云存储仓库
- 仓库列表: `GET /api/repositories?userId={userId}`
- 创建仓库: `POST /api/repositories`
- 仓库详情: `GET /api/repositories/{id}`
- 更新仓库: `PATCH /api/repositories/{id}`
- 删除仓库: `DELETE /api/repositories/{id}`
- 成员管理: `GET/POST/PATCH/DELETE /api/repositories/{id}/members`
- 三种仓库类型：
  - 公共仓库 (public)：所有人可见
  - 私人仓库 (private)：仅自己可见
  - 群组仓库 (group)：邀请成员可见

### 3. 文件管理
- 文件上传: `POST /api/files/upload` (集成云存储)
- 文件下载: `GET /api/files/download?key={fileKey}`
- 文件删除: `DELETE /api/files/{id}`
- 文件列表: `GET /api/files?path={path}`
- 文件统计: `GET /api/files/stats`

### 3. 公告管理
- 公告列表: `GET /api/announcements?limit={limit}`
- 发布公告: `POST /api/announcements`

### 4. 用户管理（管理员专用）
- 用户列表: `GET /api/users`
- 添加用户: `POST /api/users`
- 更新状态: `PATCH /api/users/{id}`
- 删除用户: `DELETE /api/users/{id}`
- 调整配额: `PATCH /api/users/{id}` (storage_quota字段)

### 5. 站内即时通讯
- 发送消息: `POST /api/messages`
- 获取会话列表: `GET /api/messages?userId={userId}`
- 获取对话消息: `GET /api/messages?userId={userId}&otherUserId={otherUserId}`
- 标记已读: `POST /api/messages/read`
- 未读消息数: `GET /api/messages/unread?userId={userId}`
- 支持用户间、用户与管理员间的即时通讯
- 已读回执功能（双勾表示已读）

### 6. 仪表盘
- 文件统计展示
- 最新公告展示
- 快捷操作入口

## 数据库设计

### users 表
- id: UUID (主键)
- email: 邮箱 (唯一)
- name: 姓名
- password_hash: 密码哈希
- role: 角色 (admin/employee)
- is_active: 是否激活
- storage_quota: 存储配额（字节，-1表示无限制，默认10GB）

### 存储配额说明
- 普通员工：默认10GB存储空间
- 管理员：无限制存储空间
- 管理员可在用户管理页面调整任何用户的配额
- 文件上传时会自动检查配额，超出则拒绝上传

### repositories 表
- id: UUID (主键)
- name: 仓库名称
- description: 描述
- type: 类型 (public/private/group)
- owner_id: 所有者ID (外键 -> users.id)
- created_at: 创建时间
- updated_at: 更新时间

### repository_members 表
- id: UUID (主键)
- repository_id: 仓库ID (外键 -> repositories.id)
- user_id: 用户ID (外键 -> users.id)
- role: 角色 (admin/member)
- invited_by: 邀请人ID (外键 -> users.id)
- joined_at: 加入时间

### repository_invitations 表
- id: UUID (主键)
- repository_id: 仓库ID (外键 -> repositories.id)
- inviter_id: 邀请人ID (外键 -> users.id)
- invitee_email: 被邀请人邮箱
- status: 状态 (pending/accepted/rejected/expired)
- created_at: 创建时间
- expires_at: 过期时间

### files 表
- id: UUID (主键)
- file_key: 对象存储key
- file_name: 文件名
- file_size: 文件大小
- file_type: 文件类型
- uploader_id: 上传者ID
- folder_path: 文件夹路径
- repository_id: 仓库ID (外键 -> repositories.id)

### announcements 表
- id: UUID (主键)
- title: 标题
- content: 内容
- author_id: 作者ID
- is_pinned: 是否置顶

### messages 表
- id: UUID (主键)
- sender_id: 发送者ID (外键 -> users.id)
- receiver_id: 接收者ID (外键 -> users.id)
- content: 消息内容
- is_read: 是否已读
- created_at: 创建时间

## 开发规范

### 代码风格
- 使用 TypeScript strict 模式
- 字段命名使用 snake_case
- 所有 API 错误必须检查并处理

### 组件规范
- 使用 shadcn/ui 组件库
- 遵循设计规范（见 DESIGN.md）
- 禁止在 JSX 中直接使用动态数据

### 数据库操作
- 使用 Supabase SDK 进行 CRUD
- 禁止使用 Drizzle ORM 查询语法
- 所有操作必须检查 error 并 throw

## 测试账号

- 邮箱: admin@oa.com
- 密码: admin123
- 角色: admin

## 注意事项

1. 文件上传功能已集成云存储，使用 S3Storage SDK
2. 所有文件下载使用预签名 URL，支持跨域
3. 用户密码已使用 bcrypt 加密存储，salt rounds = 10
4. RLS 策略暂未配置，后续实现登录功能时需补充

## GitHub 同步规范 [重要]

**仓库地址**: https://github.com/ody-cai/oa-system

### 同步要求

当网站内容发生以下更新时，**必须同步更新 GitHub 仓库**：

1. **功能新增** - 新增 API 接口、页面、模块时
2. **功能变更** - 接口参数、返回值、业务逻辑变更时
3. **数据库变更** - 表结构、字段、索引变更时
4. **技术栈更新** - 依赖版本、框架版本变更时
5. **重要修复** - 安全漏洞、性能优化等

### 需要更新的文件

| 更新类型 | 需要更新的文件 |
|----------|----------------|
| 新增 API | `README.md` (API 文档章节) + `CHANGELOG.md` |
| 新增页面 | `README.md` (功能特性章节) + `CHANGELOG.md` |
| 数据库变更 | `README.md` (数据库初始化 SQL) + `CHANGELOG.md` |
| 功能变更 | `README.md` + `AGENTS.md` + `CHANGELOG.md` |
| 依赖更新 | `README.md` (技术栈章节) + `CHANGELOG.md` |
| 版本发布 | `package.json` (version) + `CHANGELOG.md` |

### 同步流程

```bash
# 1. 更新相关文档
# 2. 提交代码
git add .
git commit -m "docs: 更新 xxx 功能文档"

# 3. 推送到 GitHub
git push origin main
```

### README.md 结构

README.md 为中英双语格式，更新时需同时更新中英文两个部分：
- 中文部分在上
- English 部分在下
- 顶部有语言切换导航

## 版本管理规范

### 版本号格式

遵循语义化版本 (Semantic Versioning)：`主版本号.次版本号.修订号`

- **主版本号 (Major)**: 重大架构变更或不兼容更新
- **次版本号 (Minor)**: 新增功能，向下兼容
- **修订号 (Patch)**: Bug 修复，向下兼容

### 版本更新流程

1. **更新 package.json** 中的 version 字段
2. **更新 CHANGELOG.md** 记录变更内容
3. **提交代码** 并推送到 GitHub

### CHANGELOG.md 格式

```markdown
## [版本号] - 日期

### 新增功能 | Added
- 新增 xxx 功能

### 优化改进 | Changed
- 优化 xxx 性能

### 问题修复 | Fixed
- 修复 xxx 问题

### 技术实现 | Technical
- 使用 xxx 技术实现
```
