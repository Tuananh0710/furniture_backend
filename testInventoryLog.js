// scripts/testInventoryLog.js
const { query } = require('./config/database');

const testInventoryLog = async () => {
  try {
    console.log('🧪 Testing Inventory Logs...');

    // 1. Kiểm tra bảng InventoryLogs
    const tables = await query("SHOW TABLES LIKE 'InventoryLogs'");
    console.log('✅ InventoryLogs table exists:', tables.length > 0);

    if (tables.length === 0) {
      console.log('❌ InventoryLogs table does not exist!');
      return;
    }

    // 2. Kiểm tra cấu trúc bảng
    const structure = await query('DESCRIBE InventoryLogs');
    console.log('🏗️ InventoryLogs structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // 3. Kiểm tra dữ liệu hiện có
    const count = await query('SELECT COUNT(*) as count FROM InventoryLogs');
    console.log(`📈 Total inventory logs: ${count[0].count}`);

    if (count[0].count > 0) {
      const sampleLogs = await query('SELECT * FROM InventoryLogs ORDER BY ChangedAt DESC LIMIT 3');
      console.log('📋 Sample logs:');
      sampleLogs.forEach(log => {
        console.log(`  LogID: ${log.LogID}, ProductID: ${log.ProductID}, Change: ${log.ChangeType} ${log.Quantity}`);
      });
    }

    // 4. Kiểm tra products
    const products = await query('SELECT ProductID, ProductName, StockQuantity FROM Products LIMIT 3');
    console.log('🛍️ Sample products:');
    products.forEach(p => {
      console.log(`  ${p.ProductID}: ${p.ProductName} (Stock: ${p.StockQuantity})`);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testInventoryLog();