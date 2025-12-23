const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middlewares/auth");

router.use(auth);

router.get("/my-orders", orderController.getMyOrders);
router.get("/total", adminAuth, orderController.getTotalRevenue);
router.get("/total-orders", adminAuth, orderController.getTotalOrders);
router.get("/total-customers", adminAuth, orderController.getTotalCustomers);
router.get("/revenue-chart", adminAuth, orderController.getRevenueChart);
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
