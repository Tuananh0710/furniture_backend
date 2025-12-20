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

  static async addItem(req, res) {
    try {
      const { userId, productId, quantity } = req.body;
      const qty = parseInt(quantity) || 1;
      const uId = parseInt(userId);
      const pId = parseInt(productId);

      if (isNaN(uId) || isNaN(pId) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid input: userId, productId, or quantity is invalid.",
          details: {
            userId: uId,
            productId: pId,
            quantity: qty,
          },
        });
      }
      const updatedCart = await Cart.addItem(uId, pId, qty);
      res.status(200).json({
        success: true,
        message: "Product added to cart successfully",
        data: updatedCart,
      });
    } catch (error) {
      let statusCode = 500;
      let message = "Server error when adding item to cart";

      if (
        error.message.includes("available") ||
        error.message.includes("enough")
      ) {
        statusCode = 400;
        message = error.message;
      } else if (error.message.includes("Missing required parameters")) {
        statusCode = 400;
        message = "Missing required parameters";
      }
      res.status(statusCode).json({
        success: false,
        message: message,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

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

  static async removeItem(req, res) {
    try {
      const { userId, cartItemId } = req.body;
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
}

module.exports = CartController;
