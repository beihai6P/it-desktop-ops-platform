/**
 * 测试上传功能脚本 - 完整版
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 测试配置
const BASE_URL = 'http://localhost:5000';
const TEST_FILE_PATH = path.join(__dirname, 'test-upload-test.zip');

// 创建测试文件
async function createTestFile() {
  const testContent = Buffer.from('这是一个测试文件内容\n用于测试上传功能\n测试时间: ' + new Date().toISOString());
  await fs.promises.writeFile(TEST_FILE_PATH, testContent);
  console.log(`✅ 创建测试文件: ${TEST_FILE_PATH}, 大小: ${testContent.length}字节`);
}

// 登录
async function login() {
  console.log('\n=== 1. 登录 ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('✅ 登录成功');
    return response.data.token;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试上传
async function testUpload(token) {
  console.log('\n=== 2. 测试上传 ===');
  try {
    await createTestFile();
    
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_FILE_PATH));
    form.append('category', 'archive');
    form.append('accessLevel', 'public');
    
    const response = await axios.post(`${BASE_URL}/api/storage/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 上传成功');
    console.log('响应:', JSON.stringify(response.data, null, 2));
    return response.data.file;
  } catch (error) {
    console.error('❌ 上传失败:', error.response?.data || error.message);
    throw error;
  } finally {
    if (fs.existsSync(TEST_FILE_PATH)) {
      await fs.promises.unlink(TEST_FILE_PATH);
    }
  }
}

// 测试下载
async function testDownload(token, fileId) {
  console.log('\n=== 3. 测试下载 ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/storage/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ 下载成功');
    console.log('文件大小:', response.data.length, '字节');
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Disposition:', response.headers['content-disposition']);
    
    // 验证文件内容
    const content = Buffer.from(response.data).toString('utf-8');
    console.log('文件内容:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    
    return true;
  } catch (error) {
    console.error('❌ 下载失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试工具上传下载
async function testToolUpload(token) {
  console.log('\n=== 4. 测试工具上传 ===');
  try {
    await createTestFile();
    
    const form = new FormData();
    form.append('name', '测试工具');
    form.append('description', '这是一个测试工具');
    form.append('category', '自动化工具');
    form.append('type', 'script');
    form.append('version', '1.0.0');
    form.append('file', fs.createReadStream(TEST_FILE_PATH));
    
    const response = await axios.post(`${BASE_URL}/api/tools`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 工具上传成功');
    console.log('工具ID:', response.data.tool.id);
    
    // 测试工具下载
    console.log('\n=== 5. 测试工具下载 ===');
    const downloadResponse = await axios.get(`${BASE_URL}/api/tools/${response.data.tool.id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ 工具下载成功');
    console.log('文件大小:', downloadResponse.data.length, '字节');
    console.log('Content-Type:', downloadResponse.headers['content-type']);
    
    return response.data.tool;
  } catch (error) {
    console.error('❌ 工具上传/下载失败:', error.response?.data || error.message);
    throw error;
  } finally {
    if (fs.existsSync(TEST_FILE_PATH)) {
      await fs.promises.unlink(TEST_FILE_PATH);
    }
  }
}

// 主测试函数
async function runTests() {
  let token;
  
  try {
    // 登录
    token = await login();
    
    // 测试存储上传下载
    const file = await testUpload(token);
    
    if (file) {
      await testDownload(token, file.fileId);
    }
    
    // 测试工具上传下载
    await testToolUpload(token);
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试异常终止');
    process.exit(1);
  }
}

// 运行测试
runTests();
