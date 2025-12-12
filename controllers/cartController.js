const Cart = require("../models/Cart");

class CartController {
  static async findByUser(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const cartData = await Cart.getCartWithItem(userId);

      if (!cartData || !cartData.cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found for this user",
        });
      }

      res.json({
        success: true,
        data: cartData,
      });
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({
        success: false,
        message: "Server error when getting cart",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Hàm thêm sản phẩm vào giỏ hàng
  static async addItem(req, res) {
    try {
      const { userId, productId, quantity } = req.body; // Lấy từ body
      const qty = parseInt(quantity) || 1;
      const uId = parseInt(userId);
      const pId = parseInt(productId);

      if (isNaN(uId) || isNaN(pId) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid input: userId, productId, or quantity is invalid.",
        });
      }

      const updatedCart = await Cart.addItem(uId, pId, qty);

      res.status(200).json({
        success: true,
        message: "Product added to cart successfully",
        data: updatedCart,
      });
    } catch (error) {
      console.error("Add item to cart error:", error);
      // Xử lý các lỗi nghiệp vụ từ Model (ví dụ: sản phẩm không tồn tại, hết hàng)
      let statusCode = 500;
      if (
        error.message.includes("available") ||
        error.message.includes("enough")
      ) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error when adding item to cart",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Hàm cập nhật số lượng sản phẩm trong giỏ hàng
  static async updateItemQuantity(req, res) {
    try {
      const { userId, cartItemId, quantity } = req.body;
      const uId = parseInt(userId);
      const cItemId = parseInt(cartItemId);
      const qty = parseInt(quantity);

      if (isNaN(uId) || isNaN(cItemId) || isNaN(qty)) {
        return res.status(400).json({
          success: false,
          message: "Invalid input: userId, cartItemId, or quantity is invalid.",
        });
      }

      const updatedCart = await Cart.updateItemQuantity(uId, cItemId, qty);

      res.status(200).json({
        success: true,
        message: "Cart item quantity updated successfully",
        data: updatedCart,
      });
    } catch (error) {
      console.error("Update cart item quantity error:", error);
      // Xử lý các lỗi nghiệp vụ từ Model
      let statusCode = 500;
      if (
        error.message.includes("không tồn tại") ||
        error.message.includes("không đủ")
      ) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message:
          error.message || "Server error when updating cart item quantity",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Hàm xóa sản phẩm khỏi giỏ hàng
  static async removeItem(req, res) {
    try {
      const { userId, cartItemId } = req.body; // Hoặc từ req.params nếu dùng DELETE /:userId/:cartItemId
      const uId = parseInt(userId);
      const cItemId = parseInt(cartItemId);

      if (isNaN(uId) || isNaN(cItemId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid input: userId or cartItemId is invalid.",
        });
      }

      const updatedCart = await Cart.removeItem(uId, cItemId);

      res.status(200).json({
        success: true,
        message: "Product removed from cart successfully",
        data: updatedCart,
      });
    } catch (error) {
      console.error("Remove item from cart error:", error);
      let statusCode = 500;
      if (error.message.includes("không tồn tại")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error when removing item from cart",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Hàm xóa toàn bộ giỏ hàng
  static async clearCart(req, res) {
    try {
      const { userId } = req.body; // Hoặc từ req.params nếu dùng DELETE /:userId
      const uId = parseInt(userId);

      if (isNaN(uId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid input: userId is invalid.",
        });
      }

      const emptyCart = await Cart.clearCart(uId);

      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: emptyCart || {
          cart: null,
          item: [],
          totalAmount: 0,
          totalItems: 0,
        },
      });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        success: false,
        message: "Server error when clearing cart",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = CartController;
