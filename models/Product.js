const { query } = require("../config/database");

class Product {
  // Lấy tất cả sản phẩm - User
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      minPrice,
      maxPrice,
      brand,
      material,
      sortBy = "CreatedAt",
      sortOrder = "DESC",
    } = filters;

    let sql = `
      SELECT 
        p.*,
        c.CategoryName,
        c.ParentCategoryID
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsActive = TRUE
    `;

    let countSql = `SELECT COUNT(*) as total FROM Products p WHERE p.IsActive = TRUE`;
    const params = [];
    const conditions = [];

    // Thêm điều kiện lọc
    if (categoryId) {
      conditions.push("p.CategoryID = ?");
      params.push(categoryId);
    }

    if (minPrice) {
      conditions.push("p.Price >= ?");
      params.push(minPrice);
    }

    if (maxPrice) {
      conditions.push("p.Price <= ?");
      params.push(maxPrice);
    }

    if (brand) {
      conditions.push("p.Brand LIKE ?");
      params.push(`%${brand}%`);
    }

    if (material) {
      conditions.push("p.Material LIKE ?");
      params.push(`%${material}%`);
    }

    if (conditions.length > 0) {
      const whereClause = " AND " + conditions.join(" AND ");
      sql += whereClause;
      countSql += whereClause;
    }

    // Sắp xếp
    const validSortFields = [
      "ProductName",
      "Price",
      "CreatedAt",
      "StockQuantity",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "CreatedAt";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY p.${sortField} ${order}`;

    // Phân trang
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Thực hiện query - SỬA THÀNH query()
    const products = await query(sql, params);
    const totalResult = await query(countSql, params.slice(0, -2));

    return {
      products,
      total: totalResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalResult[0].total / limit),
    };
  }

  // Lấy chi tiết sp theo ID - User
  static async findById(id) {
    const products = await query(
      `
      SELECT 
        p.*,
        c.CategoryName,
        c.ParentCategoryID,
        parent.CategoryName as ParentCategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Categories parent ON c.ParentCategoryID = parent.CategoryID
      WHERE p.ProductID = ? AND p.IsActive = TRUE
    `,
      [id]
    );

    return products.length > 0 ? products[0] : null;
  }

  // Tìm kiếm theo mã sản phẩm -  Admin
  static async findByCode(productCode) {
    const products = await query(
      `
      SELECT 
        p.*,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.ProductCode = ? AND p.IsActive = TRUE
    `,
      [productCode]
    );

    return products.length > 0 ? products[0] : null;
  }

  // Tìm kiếm - User and Admin
  static async search(searchFilters = {}) {
    const { q, category, minPrice, maxPrice, inStock } = searchFilters;

    let sql = `
      SELECT 
        p.*,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsActive = TRUE
    `;

    const params = [];
    const conditions = [];

    if (q) {
      conditions.push(
        "(p.ProductName LIKE ? OR p.Description LIKE ? OR p.Brand LIKE ?)"
      );
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      conditions.push("p.CategoryID = ?");
      params.push(category);
    }

    if (minPrice) {
      conditions.push("p.Price >= ?");
      params.push(minPrice);
    }

    if (maxPrice) {
      conditions.push("p.Price <= ?");
      params.push(maxPrice);
    }

    if (inStock === "true") {
      conditions.push("p.StockQuantity > 0");
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ");
    }

    sql += " ORDER BY p.CreatedAt DESC LIMIT 50";

    const products = await query(sql, params);
    return products;
  }

  // Thêm mới sản phẩm - Admin
  static async create(productData) {
    const {
      ProductName,
      ProductCode,
      CategoryID,
      Price,
      Description,
      Material,
      Color,
      Dimensions,
      Weight,
      Brand,
      StockQuantity,
      ImageURLs,
    } = productData;

    const result = await query(
      `
      INSERT INTO Products (
        ProductName, ProductCode, CategoryID, Price, Description, 
        Material, Color, Dimensions, Weight, Brand, StockQuantity, ImageURLs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        ProductName,
        ProductCode,
        CategoryID,
        Price,
        Description,
        Material,
        Color,
        Dimensions,
        Weight,
        Brand,
        StockQuantity,
        JSON.stringify(ImageURLs || []),
      ]
    );

    return result.insertId;
  }

  // Sửa - Update product - Admin
  static async update(id, productData) {
    const {
      ProductName,
      CategoryID,
      Price,
      Description,
      Material,
      Color,
      Dimensions,
      Weight,
      Brand,
      ImageURLs,
    } = productData;

    const result = await query(
      `
      UPDATE Products 
      SET ProductName = ?, CategoryID = ?, Price = ?, Description = ?,
          Material = ?, Color = ?, Dimensions = ?, Weight = ?, Brand = ?,
          ImageURLs = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE ProductID = ?
    `,
      [
        ProductName,
        CategoryID,
        Price,
        Description,
        Material,
        Color,
        Dimensions,
        Weight,
        Brand,
        JSON.stringify(ImageURLs || []),
        id,
      ]
    );

    return result.affectedRows > 0;
  }

  // Xóa (soft delete) - Admin: Chuyển isActive = 0
  static async delete(id) {
    const result = await query(
      "UPDATE Products SET IsActive = FALSE, UpdatedAt = CURRENT_TIMESTAMP WHERE ProductID = ?",
      [id]
    );

    return result.affectedRows > 0;
  }

  // Cập nhật StockQuantity - Admin
  static async updateStock(id, stockQuantity) {
    const result = await query(
      "UPDATE Products SET StockQuantity = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE ProductID = ?",
      [stockQuantity, id]
    );

    return result.affectedRows > 0;
  }

  // Kiểm tra code trùng
  static async isCodeExists(productCode, excludeId = null) {
    let sql = "SELECT ProductID FROM Products WHERE ProductCode = ?";
    const params = [productCode];

    if (excludeId) {
      sql += " AND ProductID != ?";
      params.push(excludeId);
    }

    const products = await query(sql, params);
    return products.length > 0;
  }

  // Cập nhật trạng thái sp isActive = ? - Admin
  static async updateStatus(id, isActive) {
    const result = await query(
      "UPDATE Products SET IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE ProductID = ?",
      [isActive, id]
    );

    return result.affectedRows > 0;
  }

  // Lấy sản phẩm liên quan - User
  static async getRelatedProducts(productId, categoryId, limit = 4) {
    const products = await query(
      `
      SELECT 
        p.*,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.CategoryID = ? 
        AND p.ProductID != ? 
        AND p.IsActive = TRUE
        AND p.StockQuantity > 0
      ORDER BY RAND()
      LIMIT ?
    `,
      [categoryId, productId, parseInt(limit)]
    );

    return products;
  }
}

module.exports = Product;
