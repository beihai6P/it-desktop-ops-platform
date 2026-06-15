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
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length', 'ETag']
}));
app.use(express.json());

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
  try {
    // 启动内存 MongoDB 服务器
    const mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    console.log(`MongoDB Memory Server started: ${mongoUri}`);
    
    // 连接到内存 MongoDB
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    
    await seedData();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // 保持 mongod 实例引用，防止进程退出时关闭
    global.mongod = mongod;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();