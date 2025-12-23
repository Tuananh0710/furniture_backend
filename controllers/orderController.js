const orderModel = require("../models/Order");

class OrderController {
  getMyOrders = async (req, res) => {
    try {
      const userId = req.user.UserID;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Người dùng chưa đăng nhập hoặc phiên đăng nhập không hợp lệ",
        });
      }
      const orders = await orderModel.getOrdersByUserId(userId);
      const processedOrders = orders.map((order) => ({
        OrderID: order.OrderID,
        Date: this.formatDate(order.OrderDate),
        Address: order.ShippingAddress,
        OrderValue: this.formatCurrency(order.TotalAmount),
        PaymentStatus: this.getPaymentStatusText(order.PaymentStatus),
        ShippingStatus: this.getShippingStatusText(order.OrderStatus),
      }));

      return res.status(200).json({ data: processedOrders });
    } catch (error) {
      console.error(" Lỗi không xác định:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server không xác định",
        error: error.message,
      });
    }
  };

  // Lấy chi tiết đơn hàng theo ID
  getOrderDetail = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.UserID;

      if (!orderId || isNaN(parseInt(orderId))) {
        return res.status(400).json({
          success: false,
          message: "OrderID không hợp lệ",
        });
      }
      const orderDetail = await orderModel.getOrderDetailById(
        parseInt(orderId)
      );

      if (!orderDetail) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy đơn hàng ID: ${orderId}`,
        });
      }
      const processedDetail = {
        OrderID: orderDetail.OrderID,
        OrderCode: orderDetail.OrderCode,
        OrderDate: this.formatDate(orderDetail.OrderDate),
        TotalAmount: this.formatCurrency(orderDetail.TotalAmount),
        OrderStatus: this.getShippingStatusText(orderDetail.OrderStatus),
        PaymentMethod: orderDetail.PaymentMethod,
        PaymentStatus: this.getPaymentStatusText(orderDetail.PaymentStatus),
        ShippingAddress: orderDetail.ShippingAddress,
        ShippingFee: this.formatCurrency(orderDetail.ShippingFee),
        CustomerName: orderDetail.FullName,
        CustomerEmail: orderDetail.Email,
        Items: orderDetail.Items.map((item) => ({
          ProductID: item.ProductID,
          ProductName: item.ProductName,
          ProductCode: item.ProductCode,
          Quantity: item.Quantity,
          Color: item.Color,
          UnitPrice: this.formatCurrency(item.UnitPrice),
          Subtotal: this.formatCurrency(item.Quantity * item.UnitPrice),
          FirstImageUrl: item.FirstImageUrl,
        })),
      };

      return res.status(200).json({
        success: true,
        message: "Lấy Chi tiết đơn hàng thành công",
        data: processedDetail,
      });
    } catch (error) {
      console.error(" Lỗi khi lấy chi tiết đơn hàng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server không xác định",
        error: error.message,
      });
    }
  };

  getPaymentStatusText(status) {
    const statusMap = {
      Pending: "Pending",
      Paid: "Paid",
      Failed: "Failed",
      Refunded: "Refunded",
    };
    return statusMap[status] || status;
  }

  getShippingStatusText(status) {
    const statusMap = {
      Pending: "Pending",
      Confirmed: "Confirmed",
      Packaging: "Packaging",
      Shipping: "Shipping",
      Completed: "Completed",
      Cancelled: "Cancelled",
      Returned: "Returned",
    };
    return statusMap[status] || status;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatCurrency(amount) {
    if (typeof amount !== "number") {
      amount = parseFloat(amount);
    }

    return amount.toLocaleString("vi-VN", { minimumFractionDigits: 0 });
  }

  async getTotalRevenue(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp start_date và end_date",
        });
      }

      const totalRevenue = await orderModel.getTotalRevenueByDateRange(
        start_date,
        end_date
      );

      res.status(200).json({
        success: true,
        revenue: new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(totalRevenue),
      });
    } catch (error) {
      console.error("Get revenue error:", error);
      res.status(500).json({
        success: false,
        message: "Server error when getting revenue",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getTotalOrders(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp start_date và end_date",
        });
      }

      const totalOrders = await orderModel.getTotalOrdersByDateRange(
        start_date,
        end_date
      );

      res.status(200).json({
        success: true,
        total_orders: totalOrders,
        formatted_total: totalOrders.toLocaleString("vi-VN"),
      });
    } catch (error) {
      console.error("Get total orders error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy tổng đơn hàng",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getTotalCustomers(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp start_date và end_date",
        });
      }

      const totalCustomers = await orderModel.getTotalCustomersByDateRange(
        start_date,
        end_date
      );

      res.status(200).json({
        success: true,
        total_customers: totalCustomers,
        formatted_total: totalCustomers.toLocaleString("vi-VN"),
      });
    } catch (error) {
      console.error("Get total customers error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy tổng khách hàng",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getRevenueChart(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp start_date và end_date",
        });
      }

      // Validate định dạng ngày
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD",
        });
      }

      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: "start_date không được lớn hơn end_date",
        });
      }

      const chartData = await orderModel.getRevenueChartData(
        start_date,
        end_date
      );

      // Tạo hàm formatCurrency cục bộ
      const formatCurrency = (amount) => {
        if (typeof amount !== "number") {
          amount = parseFloat(amount);
        }
        return amount.toLocaleString("vi-VN", { minimumFractionDigits: 0 });
      };

      // Format dữ liệu trả về
      const formatChartDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
      };

      // Xử lý dữ liệu theo từng loại
      let processedData;
      if (chartData.type === "daily") {
        processedData = chartData.data.map((item) => ({
          date: item.date,
          label: formatChartDate(item.date),
          revenue: item.revenue,
          formatted_revenue: formatCurrency(item.revenue), // Sử dụng hàm cục bộ
        }));
      } else {
        processedData = chartData.data.map((item) => {
          const start = new Date(item.start_date);
          const end = new Date(item.end_date);

          const formatShortDate = (date) => {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            return `${day}/${month}`;
          };

          let label;
          if (start.toDateString() === end.toDateString()) {
            label = formatShortDate(start);
          } else {
            label = `${formatShortDate(start)}-${formatShortDate(end)}`;
          }

          return {
            ...item,
            label: label,
            formatted_revenue: formatCurrency(item.revenue), // Sử dụng hàm cục bộ
          };
        });
      }

      res.status(200).json({
        success: true,
        data: {
          type: chartData.type,
          interval_days: chartData.interval_days,
          total_intervals: chartData.total_intervals || processedData.length,
          data: processedData,
        },
        message: `Lấy dữ liệu biểu đồ thành công (${chartData.type})`,
      });
    } catch (error) {
      console.error("Get revenue chart error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dữ liệu biểu đồ",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new OrderController();
