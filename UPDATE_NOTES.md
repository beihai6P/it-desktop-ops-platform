# 更新说明 v2.0.0

## 📋 更新概览

本次更新完成了对象存储系统的全面升级，从本地存储迁移至火山引擎对象存储，并修复了一系列文件下载相关的问题。

## ✅ 修复内容

### 1. 文件下载问题修复
- **修复**：下载文件被错误保存为 `.txt` 格式的问题
- **修复**：中文文件名下载乱码问题
- **修复**：文件大小不显示问题
- **修复**：下载失败（404错误）问题

### 2. 对象存储迁移
- **迁移至**：火山引擎对象存储 TOS
- **Bucket**：`wzsj001`（华东2-上海）
- **配置文件**：`backend/.env`

### 3. 文件类型白名单（安全加固）
| 文件类型 | 允许扩展名 | 最大大小 |
|---------|-----------|---------|
| 图片 | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | 20MB |
| 视频 | `.mp4`, `.mov` | 200MB |
| 压缩包 | `.zip`, `.rar`, `.7z` | 2GB |

### 4. 管理员账号更新
- **邮箱**：`877628367@qq.com`
- **密码**：`beihaibei8..`

## 📁 核心文件变更

| 文件 | 变更内容 |
|------|----------|
| `backend/services/volcengineStorage.js` | 火山引擎TOS SDK封装 |
| `backend/services/storageAdapter.js` | 统一存储适配器 |
| `backend/controllers/storageController.js` | 文件上传/下载逻辑 |
| `backend/controllers/toolController.js` | 工具下载逻辑 |
| `backend/models/StorageFile.js` | 添加archive分类 |
| `backend/.env` | 火山引擎配置 |
| `backend/utils/seedData.js` | 管理员账号更新 |

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

3. **配置CORS规则**
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
| **强制使用云存储** | 系统已禁用本地存储，所有文件必须存储在火山引擎TOS |
| **双重校验** | 先校验请求头文件大小，再校验文件流实际尺寸 |
| **白名单控制** | 仅允许图片、视频、压缩包三类文件 |
| **尺寸限制** | 按文件类型设置不同的最大大小限制 |
| **优雅降级** | Bucket不可用时给出明确错误提示 |

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

- [x] 文件上传功能正常
- [x] 文件下载功能正常（中文文件名正确）
- [x] 文件大小显示正确
- [x] 文件类型白名单生效
- [x] 火山引擎对象存储连接正常
- [x] 断点续传支持
- [x] 权限校验正常

---

**发布日期**：2026年6月15日