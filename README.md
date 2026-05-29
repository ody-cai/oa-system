# OA 办公自动化系统 | OA Office Automation System

[English](#english) | [中文](#中文)

---

<a name="中文"></a>

## 中文

一个现代化的企业办公自动化系统，集成云存储、文件管理、公告发布、用户管理和站内即时通讯等功能。

### 功能特性

- **用户认证** - 安全的登录系统，支持角色权限管理（管理员/普通员工）
- **文件管理** - 支持文件上传、下载、预览、删除，基于 S3 兼容对象存储
- **存储配额** - 每个用户独立的存储空间配额管理
- **公告管理** - 企业公告发布与置顶功能
- **站内通讯** - 用户间即时消息，支持已读回执
- **在线状态** - 用户在线状态实时显示
- **用户管理** - 管理员可管理用户账号、调整存储配额

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16 | 全栈框架（App Router） |
| React | 19 | 前端 UI 库 |
| TypeScript | 5 | 类型安全 |
| Tailwind CSS | 4 | 样式框架 |
| shadcn/ui | - | UI 组件库 |
| Supabase | - | PostgreSQL 数据库 |
| S3 Storage | - | 对象存储 |

### 项目结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # 后端 API 路由
│   │   ├── login/          # 登录页面
│   │   └── dashboard/      # 仪表盘及子页面
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   └── storage/            # 数据存储
│       └── database/       # 数据库客户端
└── next.config.ts          # Next.js 配置
```

### 快速开始

#### 环境要求

- Node.js 18+
- pnpm 8+
- Supabase 账号
- S3 兼容对象存储服务

#### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/ody-cai/oa-system.git
cd oa-system
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填写以下配置：

| 变量名 | 说明 |
|--------|------|
| `COZE_SUPABASE_URL` | Supabase 项目 URL |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `COZE_BUCKET_ENDPOINT_URL` | S3 存储端点 URL |
| `COZE_BUCKET_NAME` | 存储桶名称 |

4. **初始化数据库**

在 Supabase 控制台执行以下 SQL 创建数据表：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  storage_quota INTEGER DEFAULT 10737418240,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 文件表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100),
  uploader_id UUID NOT NULL REFERENCES users(id),
  folder_path VARCHAR(500) DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 公告表
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX files_uploader_id_idx ON files(uploader_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id);
```

5. **创建初始管理员账号**

```sql
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@example.com', '管理员', 'your-password', 'admin');
```

> 注意：生产环境请使用 bcrypt 加密密码

6. **启动开发服务器**

```bash
pnpm dev
```

访问 http://localhost:5000 即可使用。

### API 文档

#### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |

#### 文件接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 获取文件列表 |
| POST | `/api/files/upload` | 上传文件 |
| GET | `/api/files/download` | 获取下载链接 |
| DELETE | `/api/files/{id}` | 删除文件 |
| GET | `/api/files/stats` | 文件统计 |

#### 公告接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/announcements` | 获取公告列表 |
| POST | `/api/announcements` | 发布公告 |

#### 用户接口（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建用户 |
| PATCH | `/api/users/{id}` | 更新用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

#### 消息接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/messages` | 获取消息列表 |
| POST | `/api/messages` | 发送消息 |
| POST | `/api/messages/read` | 标记已读 |
| GET | `/api/messages/unread` | 未读消息数 |

### 部署说明

#### 构建生产版本

```bash
pnpm build
```

#### 启动生产服务

```bash
pnpm start
```

#### Docker 部署（可选）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
```

### 开发规范

- 使用 TypeScript strict 模式
- 遵循 ESLint 规则
- 数据库字段使用 snake_case
- 前端组件使用 shadcn/ui

### 安全注意事项

1. **密码存储**：当前为明文存储，生产环境请使用 bcrypt
2. **环境变量**：请勿将 `.env` 文件提交到版本控制
3. **HTTPS**：生产环境强制使用 HTTPS
4. **RLS 策略**：建议配置 Supabase RLS 策略增强数据安全

---

<a name="english"></a>

## English

A modern enterprise office automation system with integrated cloud storage, file management, announcement publishing, user management, and internal instant messaging.

### Features

- **User Authentication** - Secure login system with role-based access control (Admin/Employee)
- **File Management** - Upload, download, preview, and delete files with S3-compatible object storage
- **Storage Quota** - Independent storage quota management for each user
- **Announcement Management** - Publish and pin company announcements
- **Internal Messaging** - Instant messaging between users with read receipts
- **Online Status** - Real-time user online status display
- **User Management** - Admins can manage user accounts and adjust storage quotas

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | Full-stack Framework (App Router) |
| React | 19 | Frontend UI Library |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 4 | Styling Framework |
| shadcn/ui | - | UI Component Library |
| Supabase | - | PostgreSQL Database |
| S3 Storage | - | Object Storage |

### Project Structure

```
├── public/                 # Static assets
├── scripts/                # Build and start scripts
├── src/
│   ├── app/                # Pages and layouts
│   │   ├── api/            # Backend API routes
│   │   ├── login/          # Login page
│   │   └── dashboard/      # Dashboard and sub-pages
│   ├── components/ui/      # Shadcn UI components
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Utilities
│   └── storage/            # Data storage
│       └── database/       # Database client
└── next.config.ts          # Next.js configuration
```

### Quick Start

#### Requirements

- Node.js 18+
- pnpm 8+
- Supabase account
- S3-compatible object storage service

#### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ody-cai/oa-system.git
cd oa-system
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

| Variable | Description |
|----------|-------------|
| `COZE_SUPABASE_URL` | Supabase project URL |
| `COZE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `COZE_BUCKET_ENDPOINT_URL` | S3 storage endpoint URL |
| `COZE_BUCKET_NAME` | Storage bucket name |

4. **Initialize Database**

Execute the following SQL in Supabase console to create tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  storage_quota INTEGER DEFAULT 10737418240,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100),
  uploader_id UUID NOT NULL REFERENCES users(id),
  folder_path VARCHAR(500) DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX files_uploader_id_idx ON files(uploader_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id);
```

5. **Create initial admin account**

```sql
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@example.com', 'Admin', 'your-password', 'admin');
```

> Note: Use bcrypt for password hashing in production

6. **Start development server**

```bash
pnpm dev
```

Visit http://localhost:5000 to use the application.

### API Documentation

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |

#### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | Get file list |
| POST | `/api/files/upload` | Upload file |
| GET | `/api/files/download` | Get download link |
| DELETE | `/api/files/{id}` | Delete file |
| GET | `/api/files/stats` | File statistics |

#### Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | Get announcement list |
| POST | `/api/announcements` | Publish announcement |

#### Users (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get user list |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get message list |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/read` | Mark as read |
| GET | `/api/messages/unread` | Unread message count |

### Deployment

#### Build for production

```bash
pnpm build
```

#### Start production server

```bash
pnpm start
```

#### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
```

### Development Guidelines

- Use TypeScript strict mode
- Follow ESLint rules
- Use snake_case for database fields
- Use shadcn/ui for frontend components

### Security Notes

1. **Password Storage**: Currently plain text, use bcrypt in production
2. **Environment Variables**: Never commit `.env` files to version control
3. **HTTPS**: Enforce HTTPS in production
4. **RLS Policies**: Configure Supabase RLS policies for enhanced data security

---

## License | 许可证

MIT License

## Contributing | 贡献指南

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

---

**Repository | 仓库地址**: https://github.com/ody-cai/oa-system
