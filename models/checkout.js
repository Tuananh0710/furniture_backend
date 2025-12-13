const db = require("../config/database");

class CheckoutModel {
  // Tạo đơn hàng mới
  async createOrder(orderData) {
    const connection = await db.pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Tạo mã đơn hàng
      const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Tạo đơn hàng chính
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          OrderCode, UserID, TotalAmount, ShippingAddress, 
          ShippingFee, PaymentMethod, PaymentStatus, Status, Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderCode,
          orderData.userId,
          orderData.totalAmount,
          orderData.shippingAddress,
          orderData.shippingFee || 0,
          orderData.paymentMethod || "Cash",
          "Pending", // PaymentStatus
          "Pending", // Order Status
          orderData.notes || null,
        ]
      );

      const orderId = orderResult.insertId;

      // 3. Thêm sản phẩm vào OrderItems và cập nhật tồn kho
      for (const item of orderData.items) {
        // 3.1. Kiểm tra số lượng tồn kho trước
        const [productResult] = await connection.query(
          `SELECT StockQuantity FROM products WHERE ProductID = ?`,
          [item.productId]
        );

        if (productResult.length === 0) {
          throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);
        }

        if (productResult[0].StockQuantity < item.quantity) {
          throw new Error(
            `Sản phẩm ${
              item.productName || item.productId
            } không đủ số lượng tồn kho`
          );
        }

        // 3.2. Thêm vào OrderItems
        await connection.query(
          `INSERT INTO orderitems (OrderID, ProductID, Quantity, UnitPrice)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.unitPrice]
        );

        // 3.3. Cập nhật số lượng tồn kho
        await connection.query(
          `UPDATE products 
           SET StockQuantity = StockQuantity - ?
           WHERE ProductID = ?`,
          [item.quantity, item.productId]
        );
      }

      // 4. Xóa giỏ hàng
      await this.clearCart(connection, orderData.userId);

      await connection.commit();
      return { orderId, orderCode };
    } catch (error) {
      await connection.rollback();
      console.error("❌ Lỗi khi tạo đơn hàng:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Lấy thông tin giỏ hàng của user - VERSION AN TOÀN
  async getCartItems(userId) {
    try {
      // Thử nghiệm với các cách khác nhau tùy thuộc vào cấu trúc db.query()
      const result = await db.query(
        `SELECT 
            ci.CartItemID,
            ci.ProductID,
            ci.Quantity,
            p.ProductName,
            p.ProductCode,
            p.Price,
            p.ImageURLs,
            p.StockQuantity,
            p.Brand,
            p.Dimensions
         FROM cartitems ci
         INNER JOIN products p ON ci.ProductID = p.ProductID
         INNER JOIN carts c ON ci.CartID = c.CartID
         WHERE c.UserID = ? AND p.IsActive = 1`,
        [userId]
      );

      console.log("Debug - Kiểu dữ liệu trả về:", typeof result);
      console.log("Debug - result là Array?", Array.isArray(result));

      // Xử lý nhiều trường hợp có thể xảy ra
      let items = [];

      if (Array.isArray(result)) {
        // Trường hợp 1: result là mảng trực tiếp
        if (result.length > 0 && Array.isArray(result[0])) {
          // Trường hợp 1a: result = [rows, fields]
          items = result[0];
        } else {
          // Trường hợp 1b: result = rows
          items = result;
        }
      } else if (result && typeof result === "object") {
        // Trường hợp 2: result là object có thuộc tính rows
        if (Array.isArray(result.rows)) {
          items = result.rows;
        } else if (Array.isArray(result[0])) {
          // Trường hợp 2a: result[0] chứa rows
          items = result[0];
        }
      }

      console.log(" Debug - Số lượng items:", items.length);

      // Chuyển đổi dữ liệu
      if (!Array.isArray(items)) {
        console.error(" Dữ liệu không phải mảng:", items);
        return [];
      }

      return items.map((item) => ({
        cartItemId: item.CartItemID,
        productId: item.ProductID,
        productCode: item.ProductCode,
        productName: item.ProductName,
        price: item.Price,
        quantity: item.Quantity,
        imageUrls: item.ImageURLs
          ? typeof item.ImageURLs === "string"
            ? JSON.parse(item.ImageURLs)
            : item.ImageURLs
          : [],
        stockQuantity: item.StockQuantity,
        brand: item.Brand,
        dimensions: item.Dimensions,
        subtotal: item.Price * item.Quantity,
      }));
    } catch (error) {
      console.error("❌ Lỗi khi lấy giỏ hàng:", error);
      throw error;
    }
  }

  // VERSION ĐƠN GIẢN - Thử dùng cách này trước
  async getCartItemsSimple(userId) {
    try {
      // Giải pháp đơn giản: luôn đảm bảo trả về mảng
      const query = `
        SELECT 
            ci.CartItemID,
            ci.ProductID,
            ci.Quantity,
            p.ProductName,
            p.ProductCode,
            p.Price,
            p.ImageURLs,
            p.StockQuantity,
            p.Brand,
            p.Dimensions
         FROM cartitems ci
         INNER JOIN products p ON ci.ProductID = p.ProductID
         INNER JOIN carts c ON ci.CartID = c.CartID
         WHERE c.UserID = ? AND p.IsActive = 1
      `;

      // Sử dụng connection pool trực tiếp nếu cần
      const connection = await db.pool.getConnection();
      try {
        const [rows] = await connection.query(query, [userId]);
        await connection.release();

        if (!Array.isArray(rows)) {
          return [];
        }

        return rows.map((item) => ({
          cartItemId: item.CartItemID,
          productId: item.ProductID,
          productCode: item.ProductCode,
          productName: item.ProductName,
          price: parseFloat(item.Price),
          quantity: parseInt(item.Quantity),
          imageUrls: item.ImageURLs
            ? typeof item.ImageURLs === "string"
              ? JSON.parse(item.ImageURLs)
              : item.ImageURLs
            : [],
          stockQuantity: parseInt(item.StockQuantity),
          dimensions: item.Dimensions,
          subtotal: parseFloat(item.Price) * parseInt(item.Quantity),
        }));
      } catch (err) {
        await connection.release();
        throw err;
      }
    } catch (error) {
      console.error(" Lỗi khi lấy giỏ hàng:", error);
      throw error;
    }
  }

  // Xóa giỏ hàng sau khi đặt hàng (sử dụng connection từ transaction)
  async clearCart(connection, userId) {
    try {
      // Lấy CartID của user
      const [cartResult] = await connection.query(
        `SELECT CartID FROM carts WHERE UserID = ? LIMIT 1`,
        [userId]
      );

      if (cartResult.length > 0) {
        const cartId = cartResult[0].CartID;

        // Xóa tất cả items trong giỏ hàng
        await connection.query(`DELETE FROM cartitems WHERE CartID = ?`, [
          cartId,
        ]);
      }

      return true;
    } catch (error) {
      console.error("❌ Lỗi khi xóa giỏ hàng:", error);
      throw error;
    }
  }

  // Kiểm tra địa chỉ giao hàng và tính phí vận chuyển
  async calculateShippingFee(address, totalAmount) {
    try {
      let shippingFee = 50000;
      return shippingFee;
    } catch (error) {
      console.error(" Lỗi khi tính phí vận chuyển:", error);
      return 50000; // Trả về phí mặc định nếu có lỗi
    }
  }

  // Lấy thông tin user cho checkout
  async getUserInfo(userId) {
    try {
      const connection = await db.pool.getConnection();
      try {
        const [rows] = await connection.query(
          `SELECT UserID, FullName, Email, Phone, Address 
           FROM users 
           WHERE UserID = ? AND IsActive = 1`,
          [userId]
        );
        await connection.release();

        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("Người dùng không tồn tại");
        }

        return rows[0];
      } catch (err) {
        await connection.release();
        throw err;
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      throw error;
    }
  }

  // Phương thức mới: Lấy tất cả thông tin cho checkout page
  async getCheckoutInfo(userId) {
    try {
      const [userInfo, cartItems] = await Promise.all([
        this.getUserInfo(userId),
        this.getCartItemsSimple(userId), // Dùng phiên bản simple
      ]);

      // Tính toán
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const shippingFee = await this.calculateShippingFee(
        userInfo.Address,
        subtotal
      );
      const totalAmount = subtotal + shippingFee;

      return {
        userInfo,
        cartItems,
        summary: {
          subtotal,
          shippingFee,
          totalAmount,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin checkout:", error);
      throw error;
    }
  }
}

module.exports = new CheckoutModel();
