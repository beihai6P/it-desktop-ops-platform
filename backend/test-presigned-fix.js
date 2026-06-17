require('dotenv').config();

const { getStorageService } = require('./services/volcengineStorage');

async function main() {
  console.log('=== 测试分片上传预签名URL修复 ===');

  const storage = getStorageService();
  const key = 'test-multipart-fix.txt';

  // 1. 初始化分片上传
  console.log('[1/4] 调用 initiateMultipartUpload...');
  const initResult = await storage.initiateMultipartUpload(key);
  console.log('initiateMultipartUpload 返回:', JSON.stringify(initResult));
  const uploadId = initResult.uploadId;
  if (!uploadId) {
    throw new Error('initiateMultipartUpload 返回的 uploadId 为空');
  }
  console.log(`✅ 获取 uploadId: ${uploadId}`);

  // 2. 获取分片上传预签名URL
  console.log('[2/4] 调用 getPresignedUrl (uploadPart)...');
  const url = await storage.getPresignedUrl({
    key,
    operation: 'uploadPart',
    uploadId,
    partNumber: 1,
    expiresIn: 3600,
  });
  console.log(`✅ 获取预签名URL: ${url}`);

  // 3. 断言URL包含 uploadId= 和 partNumber=
  console.log('[3/4] 断言URL参数...');
  if (!url.includes('uploadId=')) {
    throw new Error('预签名URL缺少 uploadId= 参数');
  }
  if (!url.includes('partNumber=')) {
    throw new Error('预签名URL缺少 partNumber= 参数');
  }
  console.log('✅ URL 包含 uploadId= 参数');
  console.log('✅ URL 包含 partNumber= 参数');

  // 4. 清理：取消分片上传
  console.log('[4/4] 调用 abortMultipartUpload 清理...');
  await storage.abortMultipartUpload(key, uploadId);
  console.log('✅ 清理完成');

  console.log('\n🎉 测试通过');
}

main().catch(err => {
  console.error('❌ 测试失败:', err.message);
  process.exit(1);
});
