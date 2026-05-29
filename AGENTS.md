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

### 2. 文件管理
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

### files 表
- id: UUID (主键)
- file_key: 对象存储key
- file_name: 文件名
- file_size: 文件大小
- file_type: 文件类型
- uploader_id: 上传者ID
- folder_path: 文件夹路径

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
3. 用户密码当前为明文存储，生产环境需改用 bcrypt
4. RLS 策略暂未配置，后续实现登录功能时需补充
