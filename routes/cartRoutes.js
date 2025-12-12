const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cartController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Cart routes are working!" });
});

// 1. Lấy thông tin giỏ hàng theo User ID
router.get("/:id", CartController.findByUser);

// 2. Thêm sản phẩm vào giỏ hàng
// Sử dụng POST và gửi userId, productId, quantity trong body
router.post("/add", CartController.addItem);

// 3. Cập nhật số lượng sản phẩm trong giỏ hàng
// Sử dụng PUT và gửi userId, cartItemId, quantity trong body
router.put("/update-quantity", CartController.updateItemQuantity);

// 4. Xóa một sản phẩm khỏi giỏ hàng
// Sử dụng DELETE hoặc POST/PUT và gửi userId, cartItemId trong body
router.delete("/remove", CartController.removeItem);

// 5. Xóa toàn bộ giỏ hàng
// Sử dụng DELETE hoặc POST/PUT và gửi userId trong body
router.delete("/clear", CartController.clearCart);

module.exports = router;
