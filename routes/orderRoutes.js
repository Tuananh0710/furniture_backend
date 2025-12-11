const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth } = require("../middlewares/auth");

// TẤT CẢ ROUTES DƯỚI ĐÂY CẦN XÁC THỰC
router.use(auth);

// GET /api/orders/my-orders - Lấy đơn hàng của user hiện tại
router.get("/my-orders", orderController.getMyOrders);

// GET /api/orders/:orderId - Lấy chi tiết đơn hàng
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
