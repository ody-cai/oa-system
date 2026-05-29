# OA 办公自动化系统

一个现代化的企业办公自动化系统，集成云存储、文件管理、公告发布、用户管理和站内即时通讯等功能。

## 功能特性

- **用户认证** - 安全的登录系统，支持角色权限管理（管理员/普通员工）
- **文件管理** - 支持文件上传、下载、预览、删除，基于 S3 兼容对象存储
- **存储配额** - 每个用户独立的存储空间配额管理
- **公告管理** - 企业公告发布与置顶功能
- **站内通讯** - 用户间即时消息，支持已读回执
- **在线状态** - 用户在线状态实时显示
- **用户管理** - 管理员可管理用户账号、调整存储配额

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16 | 全栈框架（App Router） |
| React | 19 | 前端 UI 库 |
| TypeScript | 5 | 类型安全 |
| Tailwind CSS | 4 | 样式框架 |
| shadcn/ui | - | UI 组件库 |
| Supabase | - | PostgreSQL 数据库 |
| S3 Storage | - | 对象存储 |

## 项目结构

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

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Supabase 账号
- S3 兼容对象存储服务

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/your-username/oa-system.git
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

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |

### 文件接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 获取文件列表 |
| POST | `/api/files/upload` | 上传文件 |
| GET | `/api/files/download` | 获取下载链接 |
| DELETE | `/api/files/{id}` | 删除文件 |
| GET | `/api/files/stats` | 文件统计 |

### 公告接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/announcements` | 获取公告列表 |
| POST | `/api/announcements` | 发布公告 |

### 用户接口（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建用户 |
| PATCH | `/api/users/{id}` | 更新用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

### 消息接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/messages` | 获取消息列表 |
| POST | `/api/messages` | 发送消息 |
| POST | `/api/messages/read` | 标记已读 |
| GET | `/api/messages/unread` | 未读消息数 |

## 部署说明

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务

```bash
pnpm start
```

### Docker 部署（可选）

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

## 开发规范

- 使用 TypeScript strict 模式
- 遵循 ESLint 规则
- 数据库字段使用 snake_case
- 前端组件使用 shadcn/ui

## 安全注意事项

1. **密码存储**：当前为明文存储，生产环境请使用 bcrypt
2. **环境变量**：请勿将 `.env` 文件提交到版本控制
3. **HTTPS**：生产环境强制使用 HTTPS
4. **RLS 策略**：建议配置 Supabase RLS 策略增强数据安全

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request
