const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { auth, authorize } = require("../middlewares/auth");

router.get("/", productController.getAllProducts); // lấy 10sp bất kỳ để đẩy lên phần product của trang home.html
router.get("/search", productController.searchProducts); // tìm kiếm - fix ở front
router.get("/category/:categoryId", productController.getProductsByCategory); // Lấy sản phẩm theo danh mục - User
router.get("/:id", productController.getProductById); //Lấy chi tiết 1 sp theo id
router.get("/code/:productCode", productController.getProductByCode); // Note
router.get("/:id/related", productController.getRelatedProducts);

router.post("/", auth, authorize(["Admin"]), productController.createProduct);

router.put("/:id", auth, authorize(["Admin"]), productController.updateProduct);

router.patch(
  "/:id/stock",
  auth,
  authorize(["Admin"]),
  productController.updateStock
);

router.patch(
  "/:id/status",
  auth,
  authorize(["Admin"]),
  productController.toggleProductStatus
);

router.delete(
  "/:id",
  auth,
  authorize(["Admin"]),
  productController.deleteProduct
);

// Route đặc biệt cho inventory
router.get(
  "/:id/inventory-logs",
  auth,
  authorize(["Admin"]),
  productController.getInventoryLogs
);

// Route cho related products
router.get("/:id/related", productController.getRelatedProducts);

module.exports = router;
