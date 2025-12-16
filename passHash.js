// hashPassword.js
const bcrypt = require('bcryptjs');

async function hashPassword() {
  console.log('🔐 MÃ HÓA MẬT KHẨU VỚI BCRYPTJS\n');
  
  // Nhập mật khẩu từ dòng lệnh
  const password = process.argv[2];
  
  if (!password) {
    console.log('❌ Vui lòng nhập mật khẩu:');
    console.log('   node hashPassword.js "matkhau123"');
    return;
  }
  
  try {
    console.log(`📝 Mật khẩu gốc: "${password}"`);
    
    // Tạo salt với 10 vòng - GIỐNG NHƯ TRONG HÀM REGISTER
    const salt = await bcrypt.genSalt(10);
    console.log(`🧂 Salt: ${salt}`);
    
    // Mã hóa mật khẩu - GIỐNG NHƯ TRONG HÀM REGISTER
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`🔒 Hash: ${hashedPassword}`);
    console.log(`📏 Độ dài: ${hashedPassword.length} ký tự`);
    
    // Kiểm tra xác thực
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Xác thực thành công: ${isValid}`);
    
    console.log('\n📋 Kết quả để copy:');
    console.log(`PasswordHash: '${hashedPassword}'`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

hashPassword();