/**
 * 测试上传文件到火山引擎对象存储
 */

require('dotenv').config();

const { TosClient } = require('@volcengine/tos-sdk');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('=== 测试文件上传 ===');
    
    const client = new TosClient({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID,
      accessKeySecret: process.env.VOLC_SECRET_ACCESS_KEY,
      region: process.env.VOLC_REGION,
      endpoint: process.env.VOLC_ENDPOINT,
    });
    
    // 创建测试文件
    const testContent = Buffer.from('这是一个测试文件内容');
    const testKey = 'test/test-file.txt';
    
    console.log(`\n上传文件: ${testKey}`);
    console.log(`Bucket: ${process.env.VOLC_BUCKET}`);
    
    // 尝试直接上传
    const result = await client.putObject({
      bucket: process.env.VOLC_BUCKET,
      key: testKey,
      body: testContent,
    });
    
    console.log('✅ 上传成功!');
    console.log('ETag:', result.etag);
    
    // 尝试获取文件
    console.log('\n下载文件...');
    const getResult = await client.getObject({
      bucket: process.env.VOLC_BUCKET,
      key: testKey,
    });
    
    console.log('响应类型:', typeof getResult);
    console.log('响应键:', Object.keys(getResult));
    
    if (getResult.data) {
      console.log('getResult.data:', JSON.stringify(getResult.data, null, 2).substring(0, 500));
    }
    
    // 尝试从流中读取内容
    if (getResult.body) {
      console.log('body类型:', typeof getResult.body);
      console.log('body是否可读流:', getResult.body.readable);
      
      if (getResult.body.readable) {
        const chunks = [];
        for await (const chunk of getResult.body) {
          chunks.push(chunk);
        }
        const content = Buffer.concat(chunks).toString();
        console.log('✅ 下载成功!');
        console.log('文件内容:', content);
      }
    }
    
    // 尝试删除文件
    console.log('\n删除文件...');
    await client.deleteObject({
      bucket: process.env.VOLC_BUCKET,
      key: testKey,
    });
    console.log('✅ 删除成功!');
    
    console.log('\n🎉 所有测试通过!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('状态码:', error.statusCode);
    console.error('requestId:', error.requestId);
  }
}

testUpload();