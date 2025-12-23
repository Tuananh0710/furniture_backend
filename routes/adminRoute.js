const adminController = require("../controllers/adminController");
const { adminAuth, authorize } = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

router.get("/", adminAuth, adminController.dashBoard);
router.get("/products/stock-counts", adminAuth, adminController.getStockCount);

module.exports = router;
