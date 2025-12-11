const db = require("../config/database");

class OrderModel {
  // Lấy tất cả đơn hàng của user hiện tại
  getOrdersByUserId(userId, callback) {
    const query = `
      SELECT 
        o.OrderID,
        o.OrderCode,
        o.OrderDate,
        o.TotalAmount,
        o.Status AS OrderStatus,
        o.ShippingAddress,
        o.ShippingFee,
        o.PaymentMethod,
        o.PaymentStatus,
        u.FullName
      FROM Orders o
      INNER JOIN Users u ON o.UserID = u.UserID
      WHERE o.UserID = ?
      ORDER BY o.OrderDate DESC
    `;

    console.log(`📦 Lấy đơn hàng cho UserID: ${userId}`);

    db.query(query, [userId], (error, results) => {
      if (error) {
        console.error("❌ Lỗi khi lấy đơn hàng:", error);
        callback(error, null);
      } else {
        console.log(`✅ Tìm thấy ${results.length} đơn hàng`);
        callback(null, results);
      }
    });
  }

  // Lấy chi tiết đơn hàng (nếu cần cho trang chi tiết)
  getOrderDetail(orderId, userId, callback) {
    const query = `
      SELECT 
        o.*,
        u.FullName,
        u.Email,
        u.Phone,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'ProductName', p.ProductName,
              'Quantity', oi.Quantity,
              'UnitPrice', oi.UnitPrice,
              'Subtotal', oi.Quantity * oi.UnitPrice
            )
          )
          FROM OrderItems oi
          JOIN Products p ON oi.ProductID = p.ProductID
          WHERE oi.OrderID = o.OrderID
        ) AS OrderItems
      FROM Orders o
      JOIN Users u ON o.UserID = u.UserID
      WHERE o.OrderID = ? AND o.UserID = ?
    `;

    db.query(query, [orderId, userId], (error, results) => {
      if (error) {
        console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
        callback(error, null);
      } else {
        callback(null, results[0] || null);
      }
    });
  }
}

module.exports = new OrderModel();
