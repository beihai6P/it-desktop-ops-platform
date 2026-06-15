/**
 * 测试火山引擎配置
 */

require('dotenv').config();

console.log('=== 环境变量配置 ===');
console.log('VOLC_ACCESS_KEY_ID:', process.env.VOLC_ACCESS_KEY_ID?.substring(0, 20) + '...');
console.log('VOLC_SECRET_ACCESS_KEY:', process.env.VOLC_SECRET_ACCESS_KEY?.substring(0, 20) + '...');
console.log('VOLC_REGION:', process.env.VOLC_REGION);
console.log('VOLC_ENDPOINT:', process.env.VOLC_ENDPOINT);
console.log('VOLC_BUCKET:', process.env.VOLC_BUCKET);

// 测试SDK连接
const { TosClient } = require('@volcengine/tos-sdk');

async function testConnection() {
  try {
    console.log('\n=== 测试SDK连接 ===');
    
    const client = new TosClient({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID,
      accessKeySecret: process.env.VOLC_SECRET_ACCESS_KEY,
      region: process.env.VOLC_REGION,
      endpoint: process.env.VOLC_ENDPOINT,
    });
    
    console.log('SDK客户端创建成功');
    
    // 尝试列出存储桶
    console.log('\n尝试列出存储桶...');
    const result = await client.listBuckets();
    console.log('✅ 列出存储桶成功');
    console.log('响应类型:', typeof result);
    console.log('响应键:', Object.keys(result));
    
    // 检查响应结构
    if (result.data) {
      console.log('result.data:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('result:', JSON.stringify(result, null, 2));
    }
    
    // 尝试headBucket
    console.log(`\n尝试headBucket: ${process.env.VOLC_BUCKET}`);
    try {
      const headResult = await client.headBucket({ bucket: process.env.VOLC_BUCKET });
      console.log('✅ headBucket成功');
      console.log('响应:', JSON.stringify(headResult, null, 2));
    } catch (err) {
      console.error('❌ headBucket失败:', err.message);
      console.error('错误代码:', err.code);
      console.error('状态码:', err.statusCode);
    }
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('状态码:', error.statusCode);
  }
}

testConnection();