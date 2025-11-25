const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middlewares/auth');

// Public routes - không cần xác thực
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.get('/code/:productCode', productController.getProductByCode);

// Protected routes - cần xác thực và phân quyền
router.post(
  '/',
  auth,
  authorize(['Admin']),
  productController.createProduct
);

router.put(
  '/:id',
  auth,
  authorize(['Admin']),
  productController.updateProduct
);

router.patch(
  '/:id/stock',
  auth,
  authorize(['Admin']),
  productController.updateStock
);

router.patch(
  '/:id/status',
  auth,
  authorize(['Admin']),
  productController.toggleProductStatus
);

router.delete(
  '/:id',
  auth,
  authorize(['Admin']),
  productController.deleteProduct
);

// Route đặc biệt cho inventory
router.get(
  '/:id/inventory-logs',
  auth,
  authorize(['Admin']),
  productController.getInventoryLogs
);

// Route cho related products
router.get('/:id/related', productController.getRelatedProducts);

module.exports = router;