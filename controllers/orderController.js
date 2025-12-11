const orderModel = require("../models/Order");

class OrderController {
  // Lấy tất cả đơn hàng của user hiện tại
  getMyOrders(req, res) {
    try {
      // Lấy userId từ middleware auth (đã xác thực)
      const userId = req.user.UserID;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy thông tin người dùng",
        });
      }

      console.log(`👤 User ${userId} đang xem đơn hàng`);

      orderModel.getOrdersByUserId(userId, (error, orders) => {
        if (error) {
          console.error("❌ Lỗi trong controller:", error);
          return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy đơn hàng",
            error: error.message,
          });
        }

        // Format data để hiển thị lên bảng
        const formattedOrders = orders.map((order) => ({
          OrderID: order.OrderID,
          OrderCode: order.OrderCode,
          Date: new Date(order.OrderDate).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          Address: order.ShippingAddress,
          OrderValue: new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(order.TotalAmount),
          PaymentStatus: this.getPaymentStatusText(order.PaymentStatus),
          ShippingStatus: this.getShippingStatusText(order.OrderStatus),
        }));

        res.json({
          success: true,
          message: "Lấy danh sách đơn hàng thành công",
          data: {
            user: {
              UserID: req.user.UserID,
              FullName: req.user.FullName || orders[0]?.FullName,
            },
            orders: formattedOrders,
            summary: {
              totalOrders: orders.length,
              totalSpent: orders.reduce(
                (sum, order) => sum + order.TotalAmount,
                0
              ),
            },
          },
        });
      });
    } catch (error) {
      console.error("🔥 Lỗi không xác định:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server không xác định",
        error: error.message,
      });
    }
  }

  // Helper: Chuyển status code thành text
  getPaymentStatusText(status) {
    const statusMap = {
      Pending: "Chờ thanh toán",
      Paid: "Đã thanh toán",
      Failed: "Thanh toán thất bại",
      Refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  }

  // Helper: Chuyển shipping status thành text
  getShippingStatusText(status) {
    const statusMap = {
      Pending: "Chờ xử lý",
      Confirmed: "Đã xác nhận",
      Packaging: "Đang đóng gói",
      Shipping: "Đang giao hàng",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      Returned: "Đã trả hàng",
    };
    return statusMap[status] || status;
  }

  // Lấy chi tiết đơn hàng (nếu cần)
  getOrderDetail(req, res) {
    try {
      const orderId = req.params.orderId;
      const userId = req.user.UserID;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu OrderID",
        });
      }

      orderModel.getOrderDetail(orderId, userId, (error, orderDetail) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy chi tiết đơn hàng",
            error: error.message,
          });
        }

        if (!orderDetail) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
          });
        }

        // Parse JSON string nếu có
        if (
          orderDetail.OrderItems &&
          typeof orderDetail.OrderItems === "string"
        ) {
          orderDetail.OrderItems = JSON.parse(orderDetail.OrderItems);
        }

        res.json({
          success: true,
          message: "Lấy chi tiết đơn hàng thành công",
          data: orderDetail,
        });
      });
    } catch (error) {
      console.error("🔥 Lỗi khi lấy chi tiết đơn hàng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new OrderController();
