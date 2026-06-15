# 更新说明 v2.2.0

## 📋 更新概览

本次更新实现了前端直传火山引擎对象存储的完整优化，包括预签名Policy限制、幂等校验、SHA256重复文件检测和友好的上传进度提示。

## ✅ 新增优化特性

### 1. 预签名Policy限制
- ✅ 限制上传目录：仅允许上传至 `uploads/archive`、`uploads/tools`、`uploads/images`、`uploads/videos`
- ✅ 防止路径遍历攻击，避免用户乱传文件污染存储桶
- ✅ 根据文件类型自动分配存储目录

### 2. 幂等校验
- ✅ 上传回调接口增加幂等校验
- ✅ 文件已处于active状态时直接返回成功，避免重复入库
- ✅ 分片上传同样支持幂等性

### 3. SHA256预校验（节省带宽）
- ✅ 上传前前端先计算文件SHA256
- ✅ 发送给后端预校验，检测重复文件
- ✅ 发现重复文件直接弹窗提示，无需完整上传
- ✅ 支持用户选择直接使用已存在的文件

### 4. 友好的上传进度提示
- ✅ 计算文件指纹阶段：显示旋转动画
- ✅ 检查重复文件阶段：显示加载动画
- ✅ 上传阶段：显示进度条和百分比
- ✅ 失败阶段：显示错误信息和重试按钮
- ✅ 重复文件检测：弹窗提示并提供使用已有文件选项

## 🔧 上传流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端上传流程                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. 选择文件                                                   │
│       │                                                        │
│       ▼                                                        │
│  2. 计算SHA256（显示"计算文件指纹..."）                          │
│       │                                                        │
│       ▼                                                        │
│  3. 请求预签名URL（携带SHA256）                                   │
│       │                                                        │
│       ▼                                                        │
│  4. 后端检测重复文件                                            │
│       │── 重复存在 ──▶ 弹窗提示用户是否使用已存在文件             │
│       │                                                        │
│       ▼ 不重复                                                  │
│  5. 前端直传火山引擎（显示进度条）                                │
│       │                                                        │
│       ▼                                                        │
│  6. 确认上传完成（幂等校验）                                      │
│       │                                                        │
│       ▼                                                        │
│  7. 上传成功                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📡 新增API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/presigned/upload-url` | POST | 获取上传预签名URL（支持SHA256校验） |
| `/api/presigned/download-url/:fileId` | GET | 获取下载预签名URL |
| `/api/presigned/confirm-upload` | POST | 确认上传完成（幂等） |
| `/api/presigned/multipart/init` | POST | 初始化分片上传（支持SHA256校验） |
| `/api/presigned/multipart/complete` | POST | 完成分片上传（幂等） |
| `/api/presigned/multipart/:fileId` | DELETE | 取消分片上传 |

## 📁 核心文件变更

| 文件 | 变更内容 |
|------|----------|
| `backend/controllers/presignedController.js` | 预签名URL控制器（新增所有优化） |
| `backend/routes/presignedRoutes.js` | 预签名URL路由 |
| `backend/services/volcengineStorage.js` | 添加预签名URL和分片上传方法 |
| `backend/server.js` | 添加预签名路由 |
| `src/components/DirectUpload.tsx` | 前端直传组件（完整优化） |

## 🔧 存储池更换步骤与策略

### 更换步骤

1. **创建火山引擎Bucket**
   - 登录火山引擎控制台：https://console.volcengine.com/tos/bucket
   - 创建Bucket：`wzsj001`（或自定义名称）
   - 区域选择：`华东2（上海）cn-shanghai`
   - 访问权限：私有读写

2. **配置API密钥**
   ```env
   VOLC_ACCESS_KEY_ID=你的AccessKey
   VOLC_SECRET_ACCESS_KEY=你的SecretKey
   VOLC_REGION=cn-shanghai
   VOLC_ENDPOINT=tos-cn-shanghai.volces.com
   VOLC_BUCKET=wzsj001
   STORAGE_TYPE=volcengine
   ```

3. **配置CORS规则**（关键！）
   - 来源Origin：`http://localhost:5173`（开发环境）
   - 来源Origin：`https://your-domain.com`（生产环境）
   - 操作Methods：`PUT, GET, POST, DELETE, HEAD`
   - 允许Headers：`*`
   - 暴露Headers：`ETag`

4. **重启服务**
   ```bash
   cd backend
   npm start
   ```

### 更换策略

| 策略项 | 说明 |
|--------|------|
| **前端直传** | 文件直接上传到火山引擎，不经过后端中转 |
| **预签名URL** | 后端生成临时签名URL，有效期1小时 |
| **Policy限制** | 仅允许上传到指定目录，防止路径遍历 |
| **SHA256校验** | 上传前检测重复文件，节省带宽 |
| **幂等校验** | 避免重复入库同一份文件 |
| **分片上传** | 大文件自动分片（5MB/片），支持断点续传 |

## ✅ 修复内容（历史）

### 文件下载问题修复
- **修复**：下载文件被错误保存为 `.txt` 格式的问题
- **修复**：中文文件名下载乱码问题
- **修复**：文件大小不显示问题
- **修复**：下载失败（404错误）问题

### 文件类型白名单（安全加固）
| 文件类型 | 允许扩展名 | 最大大小 |
|---------|-----------|---------|
| 图片 | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | 20MB |
| 视频 | `.mp4`, `.mov` | 200MB |
| 压缩包 | `.zip`, `.rar`, `.7z` | 2GB |

### 管理员账号
- **邮箱**：`877628367@qq.com`
- **密码**：`beihaibei8..`

## 🚀 启动方式

```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务
npm run dev
```

## 📝 登录凭证

```
邮箱：877628367@qq.com
密码：beihaibei8..
```

## 🎯 功能验证清单

- [x] 文件前端直传功能正常
- [x] 预签名URL生成正常
- [x] SHA256重复文件检测
- [x] 幂等校验正常
- [x] 友好的上传进度提示
- [x] 分片上传支持（大文件）
- [x] 文件下载功能正常（中文文件名正确）
- [x] 文件大小显示正确
- [x] 文件类型白名单生效
- [x] 火山引擎对象存储连接正常

---

**发布日期**：2026年6月15日