const Category = require("../models/Category");

const categoryController = {
  /**
   * Lấy tất cả sản phẩm theo CategoryID
   * GET /api/products/category/:id
   */
  getProductsByCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const products = await Category.getProductsByCategoryID(parseInt(id));

      if (!products || products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm trong danh mục này",
        });
      }

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy sản phẩm",
        error: error.message,
      });
    }
  },

  /**
   * Lấy tất cả sản phẩm theo ParentCategoryID
   * GET /api/products/parent-category/:id
   */
  getProductsByParentCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const products = await Category.getProductsByParentCategoryID(
        parseInt(id)
      );

      if (!products || products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm trong danh mục cha này",
        });
      }

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy sản phẩm theo danh mục cha",
        error: error.message,
      });
    }
  },
};

module.exports = categoryController;
