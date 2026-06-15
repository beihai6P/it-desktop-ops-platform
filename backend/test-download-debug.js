/**
 * 测试下载功能 - 调试版本
 */

const axios = require('axios');
const fs = require('fs');

async function testDownload() {
  try {
    // 登录
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: '877628367@qq.com',
      password: 'beihaibei8..'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 上传一个文件
    const FormData = require('form-data');
    const testContent = Buffer.from('这是测试内容');
    
    const form = new FormData();
    form.append('file', testContent, { filename: 'test.zip' });
    form.append('category', 'archive');
    form.append('accessLevel', 'public');
    
    const uploadResponse = await axios.post('http://localhost:5000/api/storage/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      validateStatus: (status) => true
    });
    
    if (uploadResponse.status !== 201) {
      console.error('❌ 上传失败:', uploadResponse.data);
      return;
    }
    
    const fileId = uploadResponse.data.file.fileId;
    console.log(`✅ 上传成功, fileId: ${fileId}`);
    console.log(`storagePath: ${uploadResponse.data.file.storagePath || '未设置'}`);
    
    // 尝试下载
    console.log('\n=== 尝试下载 ===');
    const downloadResponse = await axios.get(`http://localhost:5000/api/storage/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer',
      validateStatus: (status) => true
    });
    
    console.log('状态码:', downloadResponse.status);
    console.log('Content-Type:', downloadResponse.headers['content-type']);
    console.log('Content-Disposition:', downloadResponse.headers['content-disposition']);
    console.log('响应数据长度:', downloadResponse.data.length);
    
    // 尝试解析为JSON
    try {
      const jsonStr = Buffer.from(downloadResponse.data).toString('utf-8');
      const json = JSON.parse(jsonStr);
      console.log('响应是JSON:', json);
    } catch {
      console.log('响应是二进制数据');
      console.log('前50字节:', downloadResponse.data.slice(0, 50).toString('hex'));
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data?.toString?.());
    }
  }
}

testDownload();