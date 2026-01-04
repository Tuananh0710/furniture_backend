const db = require("../config/database");

class AdminModel {
  //Lấy tất cả đơn hàng có trong db - Admin
  async getAllOrderInDB(userId) {
    try {
      const allOrders = await db.query(
        `
                SELECT 
                    o.OrderId,
                    o.OrderCode,
                    o.OrderDate,
                    o.TotalAmount,
                    o.ShippingAddress,
                    o.Status,
                    u.FullName,
                    u.Phone
                FROM orders o
                INNER JOIN Users u ON o.UserID = u.UserID
                ORDER BY o.OrderDate DESC 
            `,
        [userId]
      );
      return allOrders;
    } catch (error) {
      console.log("Lỗi khi lấy tất cả order: ", error);
      throw error;
    }
  }

  async getAllCustomer() {
    try {
      const allCustomer = await db.query(
        `
          SELECT u.UserID, u.Email, u.FullName, 
                 u.Phone, u.Address, u.CreatedAt, u.isActive
          
          FROM users u
          
          WHERE Role = "Member" AND isActive = 1
        `
      );
      return allCustomer;
    } catch (error) {
      console.log("Loi khi lay inf customer");
      throw error;
    }
  }

  async deleteCustomer(userId) {
    try {
      const xoa = await db.query(
        `
            UPDATE users  
            SET isActive = 0
            WHERE userID = ? AND Role = "Member";
        `,
        [userId]
      );
      return xoa;
    } catch (error) {
      console.log("Loi khi xoa customer");
      throw error;
    }
  }

  async updateInfCustomer(id, customerData) {
    const { FullName, Phone, Address, Email } = customerData;

    const result = await db.query(
      ` 
          UPDATE users
          SET  FullName = ?, Phone = ?, Address = ?, Email = ?
          WHERE UserID = ?;
        `,
      [FullName, Phone, Address, Email, id]
    );
    return result;
  }

  async updateOrderDetail(id, orderDate) {
    const { OrderCode, OrderDate, Status, PaymentMethod, ShippingAddress } =
      orderDate;
    const result = await db.query(
      `
        UPDATE orders
        SET OrderCode = ?, OrderDate = ?, Status = ?, PaymentMethod = ?, ShippingAddress = ?
        WHERE OrderID = ?;
      `,
      [OrderCode, OrderDate, Status, PaymentMethod, ShippingAddress, id]
    );
    return result;
  }
  async getTopCustomer() {
    try {
      const allCustomer = await db.query(
        `
          SELECT u.FullName, u.Phone, u.Address
          SUM(o.TotalAmount)  as total
          FROM users u
          JOIN LEFT orders o ON o.UserID = u. UserID
          WHERE u.isActive = 1 
          ORDER BY total DESC
        `
      );
      return allCustomer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AdminModel();
