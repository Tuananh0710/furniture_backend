const { body, param } = require('express-validator');

const productValidation = {
  createProduct: [
    body('ProductName')
      .notEmpty().withMessage('Tên sản phẩm là bắt buộc')
      .isLength({ min: 2, max: 255 }).withMessage('Tên sản phẩm phải từ 2-255 ký tự'),
    
    body('ProductCode')
      .notEmpty().withMessage('Mã sản phẩm là bắt buộc')
      .isLength({ max: 50 }).withMessage('Mã sản phẩm không quá 50 ký tự')
      .matches(/^[A-Za-z0-9_-]+$/).withMessage('Mã sản phẩm chỉ được chứa chữ cái, số, gạch ngang và gạch dưới'),
    
    body('CategoryID')
      .isInt({ min: 1 }).withMessage('Danh mục không hợp lệ'),
    
    body('Price')
      .isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
    
    body('StockQuantity')
      .isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên không âm'),
    
    body('Material')
      .optional()
      .isLength({ max: 100 }).withMessage('Chất liệu không quá 100 ký tự'),
    
    body('Brand')
      .optional()
      .isLength({ max: 100 }).withMessage('Thương hiệu không quá 100 ký tự')
  ],

  updateProduct: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID sản phẩm không hợp lệ'),
    
    body('ProductName')
      .optional()
      .isLength({ min: 2, max: 255 }).withMessage('Tên sản phẩm phải từ 2-255 ký tự'),
    
    body('ProductCode')
      .optional()
      .isLength({ max: 50 }).withMessage('Mã sản phẩm không quá 50 ký tự')
      .matches(/^[A-Za-z0-9_-]+$/).withMessage('Mã sản phẩm chỉ được chứa chữ cái, số, gạch ngang và gạch dưới'),
    
    body('Price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Giá phải là số dương')
  ],

  updateStock: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID sản phẩm không hợp lệ'),
    
    body('StockQuantity')
      .isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên không âm'),
    
    body('Reason')
      .optional()
      .isLength({ max: 255 }).withMessage('Lý do không quá 255 ký tự')
  ]
};

module.exports = productValidation;