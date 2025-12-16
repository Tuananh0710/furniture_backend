const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Lấy sản phẩm theo CategoryID
router.get("/category/:id", categoryController.getProductsByCategory);

// Lấy sản phẩm theo ParentCategoryID
router.get(
  "/parent-category/:id",
  categoryController.getProductsByParentCategory
);

module.exports = router;
