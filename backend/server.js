require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:5173', 
      'http://localhost:3000', 
      'http://127.0.0.1:5173', 
      'http://192.168.2.222:5173',
      'http://localhost',
      'https://your-domain.com'
    ];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length', 'ETag'],
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
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
  try {
    // 使用真实的 MongoDB 连接
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/itops-platform';
    console.log(`[MongoDB] 连接到数据库: ${mongoUri}`);
    
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
    
  } catch (error) {
    console.error('[MongoDB] 连接失败:', error.message);
    process.exit(1);
  }
};

startServer();