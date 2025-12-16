const pool = require("../config/database");

const Category = {
  /**
   * Lấy tất cả sản phẩm theo CategoryID
   * @param {number} categoryID
   * @returns {Promise<Array>}
   */
  getProductsByCategoryID: async (categoryID) => {
    try {
      const rows = await pool.query(
        "SELECT * FROM products WHERE CategoryID = ?",
        [categoryID]
      );
      return {
        rows: rows,
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy sản phẩm theo CategoryID: ${error.message}`);
    }
  },

  /**
   * Lấy tất cả sản phẩm theo ParentCategoryID (danh mục cha)
   * @param {number} parentCategoryID
   * @returns {Promise<Array>}
   */

  getProductsByParentCategoryID: async (parentCategoryID) => {
    try {
      const rows = await pool.query(
        `SELECT p.*,
                c.CategoryName
         FROM products p 
         INNER JOIN categories c ON p.CategoryID = c.CategoryID 
         WHERE c.ParentCategoryID = ?`,
        [parentCategoryID]
      );
      return {
        rows: rows,
      };
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy sản phẩm theo ParentCategoryID: ${error.message}`
      );
    }
  },
};

module.exports = Category; // Xuất class Cart để sử dụng ở các module khác
