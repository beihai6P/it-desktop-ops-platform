# IT桌面运维互动平台

## 项目简介

IT桌面运维互动平台是一个综合性的运维管理系统，为运维人员和普通用户提供全面的故障诊断、知识共享和社区交流能力。该平台采用前后端分离架构，包含故障诊断、知识库、社区交流和工具分享等核心功能模块。

---

## 已实现功能

### 核心功能模块

| 模块 | 功能描述 | 状态 |
|------|----------|------|
| **故障诊断** | AI智能诊断、故障案例库、诊断历史记录 | ✅ 已实现 |
| **知识库** | 文档管理、文档搜索、文档下载、文档收藏 | ✅ 已实现 |
| **社区交流** | 帖子发布、评论互动、点赞收藏、分类标签、检索框架 | ✅ 已实现 |
| **工具分享** | 工具上传、工具下载、工具评价 | ✅ 已实现 |
| **用户管理** | 用户注册、登录认证、权限管理 | ✅ 已实现 |
| **后台管理** | 内容审核、用户管理、系统设置 | ✅ 已实现 |

### 社区交流增强功能

| 功能 | 描述 | 权限控制 |
|------|------|----------|
| **帖子加精** | 管理员可将帖子设为精华帖 | 仅管理员 |
| **帖子置顶** | 管理员可将帖子置顶显示 | 仅管理员 |
| **帖子删除** | 删除帖子 | 管理员/发布者 |
| **帖子编辑** | 编辑帖子内容 | 管理员/发布者 |
| **分类管理** | 动态分类管理 | 仅管理员 |
| **标签管理** | 热门标签展示 | 公开 |

### 技术优化

| 优化项 | 描述 |
|--------|------|
| 移除硬编码数据 | 分类、标签数据通过API动态加载 |
| 权限系统完善 | 管理员与普通用户权限分离 |
| TypeScript修复 | 修复50+个类型错误 |
| 构建修复 | admin-frontend项目成功构建 |
| 图标资源整理 | 备案图标迁移至专用目录 |

---

## 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 编程语言 | TypeScript | 5.x |
| 构建工具 | Vite | 6.x |
| 样式框架 | TailwindCSS | 3.x |
| 图标库 | Lucide React | 0.511.x |
| 后端框架 | Express | 4.x |
| 数据库 | MongoDB | 8.x |
| 认证机制 | JWT | - |

---

## 项目结构

```
运维平台/
├── backend/                    # 后端服务
│   ├── controllers/            # 控制器
│   │   ├── authController.js   # 认证控制器
│   │   ├── categoryController.js # 分类控制器
│   │   ├── postController.js   # 帖子控制器
│   │   ├── tagController.js    # 标签控制器
│   │   └── ...                 # 其他控制器
│   ├── middleware/             # 中间件（认证、权限）
│   ├── models/                 # 数据模型
│   │   ├── Category.js         # 分类模型
│   │   ├── Tag.js              # 标签模型
│   │   └── ...                 # 其他模型
│   ├── routes/                 # 路由定义
│   │   ├── categoryRoutes.js   # 分类路由
│   │   ├── tagRoutes.js        # 标签路由
│   │   └── ...                 # 其他路由
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
│   ├── scheduler/              # 统一API调度层
│   ├── services/               # API服务
│   └── types/                  # TypeScript类型定义
├── public/                     # 静态资源
│   ├── images/                 # 图片资源
│   │   └── beian-icon.png      # 公安备案图标
│   └── favicon.svg             # 网站图标
└── package.json                # 主项目配置
```

---

## 依赖说明

### 前端依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.5",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/node": "^20.x",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vite-tsconfig-paths": "^4.3.1"
  }
}
```

### 后端依赖

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "http-proxy-middleware": "^2.0.1",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "volcengine": "^1.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 快速开始

### 前置条件

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

### 开发环境部署

#### 1. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd backend
npm install
```

#### 2. 配置环境变量

在 `backend/.env` 文件中配置：

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/it-ops-db
JWT_SECRET=your_jwt_secret_key_here_must_be_at_least_32_characters
JWT_EXPIRE=30d
```

#### 3. 启动服务

```bash
# 后端服务（端口：5000）
cd backend
npm run dev

# 前端应用（端口：5173）
npm run dev
```

---

## 生产环境部署

### 服务器要求

| 配置项 | 最低配置 | 推荐配置 |
|--------|----------|----------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 存储 | 40GB | 100GB |
| 网络 | 100Mbps | 1Gbps |

### 环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB 6.x
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动 MongoDB 服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 部署流程

```bash
# 克隆项目
git clone <repository-url>
cd 运维平台

# 安装依赖
npm install
cd backend && npm install

# 配置生产环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，设置生产环境配置

# 构建前端
npm run build

# 构建管理员前端
cd admin-frontend
npm install
npm run build

# 启动后端服务（使用 PM2）
npm install -g pm2
pm2 start backend/server.js --name it-ops-backend
pm2 startup
pm2 save
```

### Nginx 反向代理配置

创建 `/etc/nginx/sites-available/it-ops.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
    }

    # 管理员前端
    location /admin/ {
        root /path/to/your/project/admin-frontend/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持（如需要）
    location /ws/ {
        proxy_pass http://localhost:5000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/it-ops.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS 配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动更新证书
sudo systemctl enable certbot.timer
```

---

## 环境变量配置

### 后端环境变量

```env
# 服务配置
PORT=5000
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/itops-platform

# JWT 配置
JWT_SECRET=your_strong_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d

# 存储配置
# 生产环境必须使用火山引擎对象存储：STORAGE_TYPE=volcengine
# 开发环境可使用本地存储：STORAGE_TYPE=local
STORAGE_TYPE=volcengine
STORAGE_ROOT=./storage

# 火山引擎对象存储配置（生产环境必填）
VOLC_ACCESS_KEY_ID=your_volcengine_access_key_id
VOLC_SECRET_ACCESS_KEY=your_volcengine_secret_access_key
VOLC_REGION=cn-shanghai
VOLC_ENDPOINT=tos-cn-shanghai.volces.com
VOLC_BUCKET=your_bucket_name
VOLC_ACCOUNT_ID=your_account_id

# CORS 配置
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com

# API 配置
API_BASE_URL=https://your-domain.com

# 安全配置
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip,rar

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/it-ops/backend.log
```

### 前端环境变量

创建 `.env.production` 文件：

```env
VITE_API_URL=https://your-domain.com/api
VITE_APP_TITLE=IT桌面运维互动平台
VITE_APP_DESCRIPTION=专业的IT运维管理平台
VITE_LOGGING_ENABLED=false
VITE_LOG_LEVEL=warn
```

---

## 安全最佳实践

### 1. 认证安全

- 使用 HTTPS 传输数据
- JWT 密钥长度至少 32 字符
- 设置合理的 Token 过期时间
- 实现 Token 刷新机制

### 2. 数据安全

- 密码使用 bcrypt 加密（至少 10 轮）
- 防止 SQL/NoSQL 注入攻击
- 实现输入验证和参数过滤
- 敏感数据脱敏处理

### 3. 服务器安全

- 关闭不必要的端口
- 配置防火墙规则
- 定期更新系统和依赖
- 限制 SSH 访问

### 4. 文件上传安全

- 限制文件大小和类型
- 对文件名进行安全处理
- 将上传文件存储在非 Web 可访问目录
- 使用随机文件名防止路径遍历

---

## 监控与日志

### 日志配置

```bash
# 创建日志目录
sudo mkdir -p /var/log/it-ops
sudo chown www-data:www-data /var/log/it-ops

# 配置 logrotate
cat > /etc/logrotate.d/it-ops << EOF
/var/log/it-ops/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload it-ops-backend
    endscript
}
EOF
```

### PM2 监控

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs it-ops-backend

# 监控面板
pm2 monit
```

---

## API 接口

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/logout` | 用户退出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 故障诊断

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/cases` | 获取案例列表 |
| GET | `/api/cases/:id` | 获取案例详情 |
| POST | `/api/cases` | 创建案例 |
| PUT | `/api/cases/:id` | 更新案例 |
| DELETE | `/api/cases/:id` | 删除案例 |

### 知识库

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/documents` | 获取文档列表 |
| GET | `/api/documents/:id` | 获取文档详情 |
| POST | `/api/documents` | 上传文档 |
| DELETE | `/api/documents/:id` | 删除文档 |

### 社区交流

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/posts` | 获取帖子列表 |
| GET | `/api/posts/:id` | 获取帖子详情 |
| POST | `/api/posts` | 创建帖子 |
| PUT | `/api/posts/:id` | 更新帖子 |
| DELETE | `/api/posts/:id` | 删除帖子 |
| POST | `/api/posts/:id/essence` | 设置/取消精华 |
| POST | `/api/posts/:id/pin` | 设置/取消置顶 |
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/tags/popular` | 获取热门标签 |

### 评论系统

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/comments` | 获取评论列表 |
| POST | `/api/comments` | 创建评论 |
| PUT | `/api/comments/:id` | 更新评论 |
| DELETE | `/api/comments/:id` | 删除评论 |

---

## 备份策略

### 数据库备份

```bash
# 手动备份
mongodump --db it-ops-db --out /backup/mongodb/$(date +%Y%m%d)

# 自动备份脚本（每日凌晨 2 点）
cat > /etc/cron.daily/mongodb-backup << EOF
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --db it-ops-db --out $BACKUP_DIR/$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
EOF
chmod +x /etc/cron.daily/mongodb-backup
```

---

## 许可证

MIT License