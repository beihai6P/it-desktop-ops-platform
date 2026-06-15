/**
 * 测试上传功能脚本
 */

const fs = require('fs');
const path = require('path');

// 测试文件路径
const testFilePath = path.join(__dirname, 'test-upload.zip');

// 创建一个测试的zip文件
async function createTestZip() {
  // 创建一个简单的文本文件作为测试内容
  const testContent = '这是一个测试文件内容\n用于测试上传功能';
  const zlib = require('zlib');
  
  // 使用gzip压缩作为简单的zip替代
  const compressed = zlib.gzipSync(testContent);
  await fs.promises.writeFile(testFilePath, compressed);
  console.log(`✅ 创建测试文件: ${testFilePath}, 大小: ${compressed.length}字节`);
}

async function testUpload() {
  const axios = require('axios');
  
  // 登录获取token
  console.log('\n=== 1. 登录 ===');
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // 创建测试文件
    await createTestZip();
    
    // 测试上传
    console.log('\n=== 2. 测试上传 ===');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('category', 'archive');
    form.append('accessLevel', 'public');
    
    const uploadResponse = await axios.post('http://localhost:5000/api/storage/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 上传成功');
    console.log('响应:', JSON.stringify(uploadResponse.data, null, 2));
    
    const fileId = uploadResponse.data.file.fileId;
    
    // 测试下载
    console.log('\n=== 3. 测试下载 ===');
    const downloadResponse = await axios.get(`http://localhost:5000/api/storage/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ 下载成功');
    console.log('文件大小:', downloadResponse.data.length, '字节');
    console.log('Content-Type:', downloadResponse.headers['content-type']);
    
    // 清理测试文件
    await fs.promises.unlink(testFilePath);
    console.log('\n✅ 清理完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      await fs.promises.unlink(testFilePath);
    }
  }
}

// 运行测试
testUpload();