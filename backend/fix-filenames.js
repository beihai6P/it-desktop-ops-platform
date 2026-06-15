const mongoose = require('mongoose');
const iconv = require('iconv-lite');
require('dotenv').config({ path: '.env' });

const StorageFile = require('./models/StorageFile').StorageFile;

const fixFilenameEncoding = (filename) => {
  if (!filename) return filename;
  
  try {
    const hasInvalidChars = filename.includes('\ufffd');
    
    if (hasInvalidChars) {
      const decoded = iconv.decode(Buffer.from(filename, 'binary'), 'gbk');
      if (!decoded.includes('\ufffd')) {
        return decoded;
      }
    }
    
    const tryLatin1Decode = () => {
      try {
        const latin1Buffer = Buffer.from(filename, 'latin1');
        const utf8String = latin1Buffer.toString('utf-8');
        if (!utf8String.includes('\ufffd')) {
          return utf8String;
        }
      } catch (e) {
        return null;
      }
      return null;
    };
    
    const tryGbkDecode = () => {
      try {
        const decoded = iconv.decode(Buffer.from(filename, 'binary'), 'gbk');
        if (!decoded.includes('\ufffd')) {
          return decoded;
        }
      } catch (e) {
        return null;
      }
      return null;
    };
    
    const latin1Result = tryLatin1Decode();
    if (latin1Result) {
      return latin1Result;
    }
    
    const gbkResult = tryGbkDecode();
    if (gbkResult) {
      return gbkResult;
    }
    
  } catch (e) {
    console.warn(`[文件名编码修复失败]: ${e.message}`);
  }
  
  return filename;
};

const fixAllFilenames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    const files = await StorageFile.find({ status: 'active' });
    console.log(`\n📁 找到 ${files.length} 个文件`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const originalName = file.originalName;
      const fixedName = fixFilenameEncoding(originalName);
      
      if (fixedName !== originalName) {
        console.log(`\n🔧 修复文件名:`);
        console.log(`   原始: ${originalName}`);
        console.log(`   修复后: ${fixedName}`);
        
        file.originalName = fixedName;
        await file.save();
        fixedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n✅ 修复完成`);
    console.log(`   已修复: ${fixedCount} 个文件`);
    console.log(`   无需修复: ${skippedCount} 个文件`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
};

fixAllFilenames();