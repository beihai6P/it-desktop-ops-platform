require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const commentRoutes = require('./routes/commentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const postRoutes = require('./routes/postRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const templateRoutes = require('./routes/templateRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const toolRoutes = require('./routes/toolRoutes');
const faultTypeRoutes = require('./routes/faultTypeRoutes');
const experimentRoutes = require('./routes/experimentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const storageRoutes = require('./routes/storageRoutes');
const presignedRoutes = require('./routes/presignedRoutes');
const { seedData } = require('./utils/seedData');

const app = express();

app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length', 'ETag'],
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/fault-types', faultTypeRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/presigned', presignedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'IT桌面运维互动平台后端服务运行正常' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // 启动内存 MongoDB 服务器
      console.log(`[MongoDB] 尝试启动内存数据库 (第 ${retries + 1}/${maxRetries} 次)...`);
      const mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017 + retries,
        }
      });
      const mongoUri = mongod.getUri();
      console.log(`MongoDB Memory Server started: ${mongoUri}`);
      
      // 连接到内存 MongoDB
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected');
      
      await seedData();
      
      const http = require('http');
      const server = http.createServer(app);
      
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          console.log(`端口 ${PORT} 被占用，正在尝试释放...`);
          setTimeout(() => {
            server.close();
            server.listen(PORT);
          }, 1000);
        }
      });
      
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      
      // 保持 mongod 实例引用，防止进程退出时关闭
      global.mongod = mongod;
      
      return;
    } catch (error) {
      retries++;
      console.error(`[MongoDB] 启动失败 (第 ${retries} 次):`, error.message);
      
      if (retries < maxRetries) {
        console.log(`[MongoDB] ${5000 * retries}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, 5000 * retries));
      } else {
        console.error('[MongoDB] 所有重试均失败，尝试使用本地MongoDB...');
        
        // 尝试连接本地MongoDB作为备用
        try {
          const localUri = 'mongodb://127.0.0.1:27017/itops-test';
          console.log(`[MongoDB] 尝试连接本地数据库: ${localUri}`);
          await mongoose.connect(localUri);
          console.log('MongoDB Connected (local)');
          
          await seedData();
          
          const http = require('http');
          const server = http.createServer(app);
          
          server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
          });
          
          return;
        } catch (localError) {
          console.error('[MongoDB] 本地MongoDB连接也失败:', localError.message);
          
          // 使用内存存储作为最后的备选方案
          console.log('[存储] 切换到内存存储模式...');
          try {
            global.mockMongoose = require('./utils/mockMongoose');
            console.log('[存储] 内存存储模式已启用');
            
            await seedData();
            
            const http = require('http');
            const server = http.createServer(app);
            
            server.listen(PORT, () => {
              console.log(`Server running on port ${PORT} (内存存储模式)`);
            });
            
            return;
          } catch (mockError) {
            console.error('[存储] 内存存储初始化失败:', mockError.message);
            console.error('Failed to start server:', mockError);
            process.exit(1);
          }
        }
      }
    }
  }
};

startServer();