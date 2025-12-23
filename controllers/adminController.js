const order = require("../models/Order");
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

  static async getStockCount(req, res) {
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
}

module.exports = adminController;
