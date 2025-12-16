const db = require("../config/database");

class Cart {
  /**
   * Tìm giỏ hàng theo ID người dùng
   * @param {number} userId - ID của người dùng
   * @returns {Promise<Object|null>} Thông tin giỏ hàng hoặc null nếu không tìm thấy
   */
  static async findByUserId(userId) {
    try {
      const cart = await db.query(
        `
                SELECT c.CartID, c.UserId, c.CreatedAt, c.UpdatedAt
                FROM Carts c 
                WHERE c.UserID = ?
                `,
        [userId]
      );

      return cart[0] || null; // Trả về giỏ hàng đầu tiên hoặc null
    } catch (error) {
      console.error("Find cart by user Id error: ", error);
      throw error;
    }
  }

  /**
   * Tạo giỏ hàng mới cho người dùng
   * @param {number} userId - ID của người dùng
   * @returns {Promise<number>} ID của giỏ hàng vừa tạo
   */
  static async create(userId) {
    try {
      const result = await db.query(
        `
                INSERT INTO Carts (UserID)
                VALUES (?)
                `,
        [userId]
      );
      return result.insertId; // Trả về CartID vừa được tạo
    } catch (error) {
      console.error("Create Cart error:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin đầy đủ của giỏ hàng bao gồm các sản phẩm bên trong
   * @param {number} userId - ID của người dùng
   * @returns {Promise<Object>} Đối tượng chứa thông tin giỏ hàng, sản phẩm, tổng tiền và số lượng sản phẩm
   */
  static async getCartWithItem(userId) {
    try {
      // Tìm giỏ hàng hiện có của người dùng
      let cart = await this.findByUserId(userId);

      // Nếu chưa có giỏ hàng, tạo mới
      if (!cart) {
        const cartId = await this.create(userId);
        cart = { CartID: cartId, UserID: userId };
      }

      // Lấy tất cả sản phẩm trong giỏ hàng kèm thông tin chi tiết từ bảng Products
      const item = await db.query(
        `
            SELECT 
                ci.CartItemID,
                ci.ProductID,
                ci.Quantity,
                ci.AddedAt,
                p.ProductName,
                p.ProductCode,
                p.Price,
                p.StockQuantity,
                p.ImageURLs,
                p.IsActive
                FROM CartItems ci
                INNER JOIN Products p ON ci.ProductID = p.ProductID
                WHERE ci.CartID=?
                ORDER BY ci.AddedAt DESC
            `,
        [cart.CartID]
      );

      // Tính tổng tiền của tất cả sản phẩm trong giỏ
      const totalAmount = item.reduce((total, item) => {
        return total + item.Price * item.Quantity;
      }, 0);

      // Trả về thông tin đầy đủ của giỏ hàng
      return {
        cart: cart, // Thông tin giỏ hàng
        item: item, // Danh sách sản phẩm trong giỏ
        totalAmount: totalAmount, // Tổng tiền
        totalItems: item.length, // Tổng số loại sản phẩm
      };
    } catch (error) {
      console.error("Error when get cart with item: ", error);
      throw error;
    }
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {number} userId - ID của người dùng
   * @param {number} productId - ID của sản phẩm
   * @param {number} quantity - Số lượng thêm (mặc định: 1)
   * @returns {Promise<Object>} Thông tin giỏ hàng sau khi thêm
   */
  static async addItem(userId, productId, quantity = 1) {
    try {
      // Kiểm tra và tạo giỏ hàng nếu chưa có
      let cart = await this.findByUserId(userId);
      if (!cart) {
        const cartId = await this.create(userId);
        cart = { CartId: cartId, UserId: userId };
      }

      // Kiểm tra sản phẩm có tồn tại và còn hoạt động không
      const product = await db.query(
        `
                SELECT ProductID, ProductName, Price, StockQuantity, IsActive
                FROM Products
                WHERE ProductID=? AND IsActive = 1
                `,
        [productId]
      );

      // Xử lý trường hợp sản phẩm không hợp lệ
      if (product.length === 0) {
        throw new Error("Product is not available!");
      }

      // Kiểm tra số lượng tồn kho
      if (product[0].StockQuantity < quantity) {
        throw new Error("Inventory stock is not enough!");
      }

      // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
      const existingItem = await db.query(
        `
                SELECT CartItemId, Quantity
                FROM CartItems
                WHERE CartID= ? AND ProductID = ?
                `,
        [cart.CartID, productId]
      );

      // Nếu sản phẩm đã có trong giỏ, cập nhật số lượng
      if (existingItem.length > 0) {
        const newQuantity = existingItem[0].Quantity + quantity;
        await db.query(
          `
                UPDATE CartItems 
                SET Quantity = ? 
                WHERE CartItemID = ?
                `,
          [newQuantity, existingItem[0].CartItemID]
        );
      } else {
        // Nếu sản phẩm chưa có trong giỏ, thêm mới
        await db.query(
          `
                INSERT INTO CartItems (CartID, ProductID, Quantity) 
                VALUES (?, ?, ?)
                `,
          [cart.CartID, productId, quantity]
        );
      }

      // Cập nhật thời gian chỉnh sửa giỏ hàng
      await db.query(
        `
                UPDATE Carts 
                SET UpdatedAt = NOW() 
                WHERE CartID = ?
            `,
        [cart.CartID]
      );

      // Trả về giỏ hàng sau khi đã cập nhật
      return await this.getCartWithItem(userId);
    } catch (error) {
      console.error("Add item to cart error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   * @param {number} userId - ID của người dùng
   * @param {number} cartItemId - ID của mục trong giỏ hàng
   * @param {number} quantity - Số lượng mới
   * @returns {Promise<Object>} Thông tin giỏ hàng sau khi cập nhật
   */
  static async updateItemQuantity(userId, cartItemId, quantity) {
    try {
      // Nếu số lượng <= 0 thì xóa sản phẩm khỏi giỏ hàng
      if (quantity <= 0) {
        return await this.removeItem(userId, cartItemId);
      }

      // Kiểm tra cart item thuộc về user và có đủ hàng trong kho không
      const cartItem = await db.query(
        `
        SELECT ci.CartItemID, ci.ProductID, p.StockQuantity
        FROM CartItems ci
        INNER JOIN Carts c ON ci.CartID = c.CartID
        INNER JOIN Products p ON ci.ProductID = p.ProductID
        WHERE ci.CartItemID = ? AND c.UserID = ?
      `,
        [cartItemId, userId]
      );

      // Kiểm tra sản phẩm có tồn tại trong giỏ hàng không
      if (cartItem.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
      }

      // Kiểm tra số lượng tồn kho
      if (cartItem[0].StockQuantity < quantity) {
        throw new Error("Số lượng sản phẩm trong kho không đủ");
      }

      // Cập nhật số lượng
      await db.query(
        `
        UPDATE CartItems 
        SET Quantity = ? 
        WHERE CartItemID = ?
      `,
        [quantity, cartItemId]
      );

      // Cập nhật thời gian sửa giỏ hàng
      await db.query(
        `
        UPDATE Carts 
        SET UpdatedAt = NOW() 
        WHERE UserID = ?
      `,
        [userId]
      );

      return await this.getCartWithItem(userId);
    } catch (error) {
      console.error("Update cart item quantity error:", error);
      throw error;
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   * @param {number} userId - ID của người dùng
   * @param {number} cartItemId - ID của mục trong giỏ hàng
   * @returns {Promise<Object>} Thông tin giỏ hàng sau khi xóa
   */
  static async removeItem(userId, cartItemId) {
    try {
      // Kiểm tra cart item thuộc về user
      const cartItem = await db.query(
        `
        SELECT ci.CartItemID
        FROM CartItems ci
        INNER JOIN Carts c ON ci.CartID = c.CartID
        WHERE ci.CartItemID = ? AND c.UserID = ?
      `,
        [cartItemId, userId]
      );

      // Kiểm tra sản phẩm có tồn tại trong giỏ hàng không
      if (cartItem.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
      }

      // Xóa sản phẩm khỏi giỏ hàng
      await db.query(
        `
        DELETE FROM CartItems 
        WHERE CartItemID = ?
      `,
        [cartItemId]
      );

      // Cập nhật thời gian sửa giỏ hàng
      await db.query(
        `
        UPDATE Carts 
        SET UpdatedAt = NOW() 
        WHERE UserID = ?
      `,
        [userId]
      );

      return await this.getCartWithItem(userId);
    } catch (error) {
      console.error("Remove item from cart error:", error);
      throw error;
    }
  }
}

module.exports = Cart; // Xuất class Cart để sử dụng ở các module khác
