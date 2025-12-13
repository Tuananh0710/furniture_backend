const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { auth } = require("../middlewares/auth");

// Tất cả routes đều yêu cầu đăng nhập
router.use(auth);

// GET /checkout - Lấy thông tin checkout
router.get("/inf", checkoutController.getCheckout);

// POST /checkout/place-order - Xử lý đặt hàng
router.post("/place-order", checkoutController.placeOrder);

module.exports = router;
