const db = require('../config/database');

class InventoryLog {
  static async create(logData) {
    try {
      const {
        ProductID, ChangeType, Quantity, OldStock, NewStock,
        Reason, ReferenceType, ReferenceID = null, ChangedBy
      } = logData;

      console.log('📝 Creating inventory log:', {
        ProductID, ChangeType, Quantity, OldStock, NewStock, Reason
      });

      // SỬA: Sử dụng db.query thay vì db.execute
      const result = await db.query(`
        INSERT INTO InventoryLogs (
          ProductID, ChangeType, Quantity, OldStock, NewStock,
          Reason, ReferenceType, ReferenceID, ChangedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [ProductID, ChangeType, Quantity, OldStock, NewStock, Reason, ReferenceType, ReferenceID, ChangedBy]);

      console.log('✅ Inventory log created with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error creating inventory log:', error);
      throw error;
    }
  }

  static async findByProductId(productId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      console.log(`🔍 Finding inventory logs for product ${productId}`);

      // SỬA: Sử dụng db.query thay vì db.execute
      const logs = await db.query(`
        SELECT 
          il.*,
          u.FullName as ChangedByName
        FROM InventoryLogs il
        LEFT JOIN Users u ON il.ChangedBy = u.UserID
        WHERE il.ProductID = ?
        ORDER BY il.ChangedAt DESC
        LIMIT ? OFFSET ?
      `, [productId, parseInt(limit), offset]);

      console.log(`📊 Found ${logs.length} logs for product ${productId}`);

      // SỬA: Sử dụng db.query thay vì db.execute
      const totalResult = await db.query(
        'SELECT COUNT(*) as total FROM InventoryLogs WHERE ProductID = ?',
        [productId]
      );

      return {
        logs,
        total: totalResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalResult[0].total / limit)
      };
    } catch (error) {
      console.error('❌ Error finding inventory logs:', error);
      throw error;
    }
  }
}

module.exports = InventoryLog;