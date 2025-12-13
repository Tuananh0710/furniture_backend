const db = require("../config/database");

class OrderModel {
  // Lấy tất cả đơn hàng của user hiện tại
  async getOrdersByUserId(userId) {
    try {
      console.log(`📦 Lấy đơn hàng cho UserID: ${userId}`);

      const orders = await db.query(
        `
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
            ORDER BY o.OrderDate DESC`,
        [userId]
      );
      console.log(`✅ Tìm thấy ${orders.length} đơn hàng`);
      return orders;
    } catch (error) {
      console.error("❌ Lỗi khi lấy đơn hàng:", error);
      throw error;
    }
  }

  // Lấy chi tiết đơn hàng (bao gồm danh sách sản phẩm)
  async getOrderDetailById(orderId) {
    try {
      console.log(`🔍 Lấy chi tiết đơn hàng ID: ${orderId}`);

      // 1. Lấy thông tin chính của Đơn hàng
      const orderInfo = await db.query(
        `
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
                u.FullName,
                u.Email
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.UserID
            WHERE o.OrderID = ?`,
        [orderId]
      );

      if (orderInfo.length === 0) {
        return null;
      }

      // 2. Lấy danh sách Sản phẩm (Order Items)
      const orderItems = await db.query(
        `
            SELECT
                oi.Quantity,
                oi.UnitPrice,
                p.ProductID,
                p.ProductName,
                p.ProductCode,
                p.ImageURLs
            FROM OrderItems oi
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            WHERE oi.OrderID = ?`,
        [orderId]
      );

      console.log(`✅ Tìm thấy ${orderItems.length} mặt hàng`);

      // 3. Kết hợp và trả về
      return {
        ...orderInfo[0],
        Items: orderItems.map((item) => {
          // Chuyển chuỗi JSON ImageURLs thành mảng
          const imageUrls = JSON.parse(item.ImageURLs || "[]");
          return {
            Quantity: item.Quantity,
            UnitPrice: item.UnitPrice,
            ProductName: item.ProductName,
            ProductCode: item.ProductCode,
            // Lấy URL ảnh đầu tiên
            FirstImageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
          };
        }),
      };
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
      throw error;
    }
  }
}

module.exports = new OrderModel();
