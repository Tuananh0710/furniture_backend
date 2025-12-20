const Product = require("../models/Product");
const InventoryLog = require("../models/InventoryLog");

const productController = {
  // Lấy tất cả sản phẩm -User
  getAllProducts: async (req, res) => {
    try {
      const result = await Product.findAll(req.query);

      res.json({
        success: true,
        data: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách sản phẩm",
      });
    }
  },

  // Lấy sản phẩm theo ID - User
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Get product by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin sản phẩm",
      });
    }
  },

  // Tìm kiếm sản phẩm - User and Admin
  searchProducts: async (req, res) => {
    try {
      const products = await Product.search(req.query);

      res.json({
        success: true,
        data: products,
        message: "Danh sách sản phẩm tìm kiếm thành công",
        total: products.length,
      });
    } catch (error) {
      console.error("Search products error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm sản phẩm",
      });
    }
  },

  // Lấy sản phẩm theo loại sp - User
  getProductsByCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { page, limit } = req.query;

      const result = await Product.findByCategory(categoryId, page, limit);

      res.json({
        success: true,
        data: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Get products by category error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy sản phẩm theo danh mục",
      });
    }
  },

  // Tạo sản phẩm mới - Admin
  createProduct: async (req, res) => {
    try {
      const productData = req.body;

      // Kiểm tra product code trùng
      const isCodeExists = await Product.isCodeExists(productData.ProductCode);
      if (isCodeExists) {
        return res.status(400).json({
          success: false,
          message: "Mã sản phẩm đã tồn tại",
        });
      }

      // Tạo sản phẩm
      const productId = await Product.create(productData);

      // Ghi log tồn kho ban đầu - SỬA: Sử dụng InventoryLog model
      if (productData.StockQuantity > 0) {
        await InventoryLog.create({
          ProductID: productId,
          ChangeType: "In",
          Quantity: productData.StockQuantity,
          OldStock: 0,
          NewStock: productData.StockQuantity,
          Reason: "Nhập hàng ban đầu",
          ReferenceType: "Initial",
          ChangedBy: req.user.UserID,
        });
      }

      // Lấy thông tin sản phẩm vừa tạo
      const newProduct = await Product.findById(productId);

      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: newProduct,
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo sản phẩm",
      });
    }
  },

  // Tìm kiếm theo mã sp - Addmin
  getProductByCode: async (req, res) => {
    try {
      const { productCode } = req.params;
      const product = await Product.findByCode(productCode);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Get product by code error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin sản phẩm",
      });
    }
  },

  //Cập nhật product -Admin
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;

      const isUpdated = await Product.update(id, productData);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      const updatedProduct = await Product.findById(id);

      res.json({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật sản phẩm",
      });
    }
  },

  //cập nhật số lượng - Admin
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { StockQuantity, Reason = "Điều chỉnh tồn kho" } = req.body;

      console.log(`📦 Updating stock for product ${id} to ${StockQuantity}`);

      // Lấy stock hiện tại
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      const oldStock = product.StockQuantity;
      const quantityChange = StockQuantity - oldStock;

      console.log(
        `📊 Stock change: ${oldStock} -> ${StockQuantity} (change: ${quantityChange})`
      );

      // Cập nhật stock
      const isUpdated = await Product.updateStock(id, StockQuantity);
      if (!isUpdated) {
        return res.status(500).json({
          success: false,
          message: "Không thể cập nhật tồn kho",
        });
      }

      // Ghi log tồn kho - SỬA: Sử dụng InventoryLog model
      await InventoryLog.create({
        ProductID: id,
        ChangeType: quantityChange >= 0 ? "In" : "Out",
        Quantity: Math.abs(quantityChange),
        OldStock: oldStock,
        NewStock: StockQuantity,
        Reason: Reason,
        ReferenceType: "Adjustment",
        ChangedBy: req.user.UserID,
      });

      console.log("✅ Inventory log created successfully");

      res.json({
        success: true,
        message: "Cập nhật tồn kho thành công",
        data: {
          productId: parseInt(id),
          productName: product.ProductName,
          oldStock,
          newStock: StockQuantity,
          change: quantityChange,
          reason: Reason,
        },
      });
    } catch (error) {
      console.error("❌ Update stock error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật tồn kho",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  //xóa sản phẩm - Admin
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const isDeleted = await Product.delete(id);

      if (!isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      res.json({
        success: true,
        message: "Xóa sản phẩm thành công",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa sản phẩm",
      });
    }
  },

  //Kích hoạt hoặc vô hiệu hóa sản phẩm -Admin
  toggleProductStatus: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      const newStatus = !product.IsActive;
      await Product.updateStatus(id, newStatus);

      res.json({
        success: true,
        message: `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} sản phẩm`,
        data: {
          productId: parseInt(id),
          isActive: newStatus,
        },
      });
    } catch (error) {
      console.error("Toggle product status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thay đổi trạng thái sản phẩm",
      });
    }
  },

  //ghi lại log sửa tồn kho - Admin
  getInventoryLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      console.log(
        `🔍 API Called: getInventoryLogs for product ${id}, page ${page}, limit ${limit}`
      );

      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      console.log(`✅ Product found: ${product.ProductName}`);

      // SỬA: Sử dụng InventoryLog model để lấy dữ liệu
      const result = await InventoryLog.findByProductId(id, page, limit);

      console.log(`📊 Found ${result.logs.length} inventory logs`);

      res.json({
        success: true,
        message: `Lấy lịch sử tồn kho thành công cho sản phẩm ${product.ProductName}`,
        data: result.logs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("❌ Get inventory logs error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử tồn kho",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  //lấy sẩn phẩm liên quan - User
  getRelatedProducts: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      const relatedProducts = await Product.getRelatedProducts(
        id,
        product.CategoryID,
        4
      );

      res.json({
        success: true,
        data: relatedProducts,
      });
    } catch (error) {
      console.error("Get related products error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy sản phẩm liên quan",
      });
    }
  },
};

module.exports = productController;
