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
}

module.exports = CartController;
