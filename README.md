# IT桌面运维互动平台

## 项目简介

IT桌面运维互动平台是一个综合性的运维管理系统，为超级管理员提供全面的系统管理能力。该平台采用前后端分离架构，包含用户管理、角色权限、内容审核、数据洞察和系统设置等核心功能模块。

### 功能模块

| 模块 | 功能描述 |
|------|----------|
| **仪表台** | 系统概览、数据统计、实时状态监控 |
| **用户管理** | 用户列表、增删改查、状态管理、角色分配 |
| **角色权限** | 角色定义、权限配置、权限继承 |
| **内容审核** | 帖子审核、文档管理、评论管理 |
| **数据洞察** | 数据分析、图表展示、趋势分析 |
| **系统设置** | 常规设置、安全设置、通知设置、系统配置 |

### 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 编程语言 | TypeScript | 5.x |
| 构建工具 | Vite | 6.x |
| 样式框架 | TailwindCSS | 3.x |
| 状态管理 | Zustand | 5.x |
| 图标库 | Lucide React | 0.511.x |
| 后端框架 | Express | 4.x |
| 数据库 | MongoDB | 8.x |
| 认证机制 | JWT | - |

---

## 快速开始

### 前置条件

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

### 项目结构

```
运维平台/
├── backend/                    # 后端服务
│   ├── controllers/            # 控制器
│   ├── middleware/             # 中间件（认证、权限）
│   ├── models/                 # 数据模型
│   ├── routes/                 # 路由定义
│   ├── services/               # 业务服务
│   ├── utils/                  # 工具函数
│   ├── .env                    # 环境配置
│   ├── package.json            # 后端依赖
│   └── server.js               # 服务入口
├── admin-frontend/             # 管理员前端
│   ├── src/                    # 源代码
│   ├── package.json            # 前端依赖
│   └── vite.config.ts          # Vite配置
├── src/                        # 主前端应用
│   ├── components/             # UI组件
│   ├── pages/                  # 页面组件
│   ├── services/               # API服务
│   └── types/                  # TypeScript类型定义
└── package.json                # 主项目配置
```

---

## 部署方式

### 1. 克隆项目

```bash
git clone <repository-url>
cd 运维平台
```

### 2. 安装依赖

#### 前端依赖

```bash
npm install
```

#### 后端依赖

```bash
cd backend
npm install
```

### 3. 启动服务

#### 开发模式

**后端服务**（端口：5000）：
```bash
cd backend
npm run dev
```

**前端应用**（端口：5173）：
```bash
npm run dev
```

**管理员前端**（端口：5174）：
```bash
cd admin-frontend
npm run dev
```

#### 生产构建

**前端构建**：
```bash
npm run build
```

**后端启动**：
```bash
cd backend
npm start
```

---

## 配置方式

### 后端配置

在 `backend/.env` 文件中配置以下环境变量：

```env
# 服务端口
PORT=5000

# MongoDB连接地址
MONGODB_URI=mongodb://127.0.0.1:27017/it-ops-db

# JWT密钥（必须至少32个字符）
JWT_SECRET=your_jwt_secret_key_here_must_be_at_least_32_characters

# JWT过期时间
JWT_EXPIRE=30d
```

### 前端配置

前端 API 服务地址配置在 `src/services/api.ts` 文件中：

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

可通过环境变量 `VITE_API_URL` 覆盖默认地址。

### 数据库初始化

确保 MongoDB 服务已启动，数据库将自动创建。首次运行时会自动初始化示例数据。

---

## API 接口

### 用户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建新用户 |
| PUT | `/api/users/:id` | 更新用户信息 |
| DELETE | `/api/users/:id` | 删除用户 |

### 角色权限

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/roles` | 获取角色列表 |
| POST | `/api/roles` | 创建角色 |
| PUT | `/api/roles/:id` | 更新角色 |
| DELETE | `/api/roles/:id` | 删除角色 |

### 内容审核

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/review/posts` | 获取待审核帖子 |
| PUT | `/api/review/posts/:id/approve` | 审核通过 |
| PUT | `/api/review/posts/:id/reject` | 拒绝审核 |

### 数据洞察

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/analytics` | 获取统计数据 |

---

## 安全说明

1. **身份认证**：JWT Token认证，存储在 localStorage
2. **权限控制**：基于角色的访问控制（RBAC）
3. **输入验证**：前端表单验证 + 后端参数校验
4. **数据加密**：密码使用 bcrypt 加密存储
5. **会话管理**：支持会话超时和手动退出

---

## 许可证

MIT License