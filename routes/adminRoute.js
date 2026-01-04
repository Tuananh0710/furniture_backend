const adminController = require("../controllers/adminController");
const { adminAuth, authorize } = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

router.get("/", adminAuth, adminController.dashBoard);
router.get("/products/stock-counts", adminAuth, adminController.StockCount);
router.get("/allOrders", adminAuth, adminController.AllOrder);
router.get("/allCustomer", adminAuth, adminController.AllCustomer);
router.put("/deleteCustomer", adminAuth, adminController.DeleteCustomer);
router.put("/updateCustomer/:id", adminAuth, adminController.UpdateCustomer);
router.get("/topcustomer", adminAuth, adminController.TopCustomer);
router.put("/updateOrder/:OrderID", adminAuth, adminController.UpdateOrder);

module.exports = router;
