const order = require("../models/Order");
const admin = require("../models/Admin");
class adminController {
  static async dashBoard(req, res) {
    try {
      const stats = await order.getDashboardStats();

      return res.status(200).json({
        success: true,
        message: "Successful",
        data: {
          today_revenue: stats.today_revenue,
          today_total_order: stats.today_total_order,
          today_total_product: stats.today_total_product,
          today_total_refund_product: stats.today_total_refund_product,
          today_total_refund_order: stats.today_total_refund_order,
        },
        date: stats.date,
      });
    } catch (error) {
      console.error("Get dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error when getting information",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  static async StockCount(req, res) {
    try {
      const Stock = await order.getStockCounts();

      return res.status(200).json({
        success: true,
        message: "Successful",
        data: {
          in_Stock: Stock.in_stock,
          out_of_Stock: Stock.out_of_stock,
          low_Stock: Stock.low_stock,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi thống kê số lượng tồn",
        error: error.message,
      });
    }
  }

  static async AllOrder(req, res) {
    try {
      const userId = req.user.UserID;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "TK chưa đăng nhập hoặc phiên đăng nhập k hợp lệ",
        });
      }
      const allOrder = await admin.getAllOrderInDB(userId);

      return res.status(200).json({
        success: true,
        message: "Successful!",
        data: allOrder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy all order in db",
        error: error.message,
      });
    }
  }

  static async AllCustomer(req, res) {
    try {
      const allcustomer = await admin.getAllCustomer();

      return res.status(200).json({
        success: true,
        message: "Successful",
        data: allcustomer,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Loi server",
        error: error.message,
      });
    }
  }

  static async DeleteCustomer(req, res) {
    try {
      const { userId } = req.body;

      await admin.deleteCustomer(userId);

      const allUser = await admin.getAllCustomer();

      return res.status(200).json({
        success: true,
        message: " xoa thanh cong",
        data: allUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Loi server",
        error: error.message,
      });
    }
  }

  static async UpdateCustomer(req, res) {
    try {
      const { id } = req.params;
      const customerDate = req.body;

      const yetUpdateCustomer = await admin.getAllCustomer();

      const isUpdated = await admin.updateInfCustomer(id, customerDate);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "loi tim thay inf khach hang",
          error: error.message,
        });
      }

      const updatedCustomer = await admin.getAllCustomer();
      return res.status(200).json({
        success: true,
        message: "thanh cong",
        date: {
          beforeUpdate: yetUpdateCustomer,
          afterUpdate: updatedCustomer,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "loi server",
      });
    }
  }

  static async UpdateOrder(req, res) {
    try {
      const { OrderID } = req.params;
      const orderData = req.body;

      const isUpdated = await admin.updateOrderDetail(OrderID, orderData);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "Loi k tim thay id order",
          error: error.message,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Thanh cong",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Loi server",
      });
    }
  }

  static async TopCustomer(req, res) {
    try {
      const topcustomer = await admin.getTopCustomer();

      return res.status(200).json({
        success: true,
        message: "Thanh cong",
        data: topcustomer,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Loi server",
      });
    }
  }
}

module.exports = adminController;
