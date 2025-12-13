const orderModel = require("../models/Order");

class OrderController {
  // Lấy tất cả đơn hàng của user hiện tại
  // ⚠️ CHUYỂN THÀNH ARROW FUNCTION
  getMyOrders = async (req, res) => {
    // Thay đổi ở đây
    try {
      // ... (Phần logic kiểm tra user ID giữ nguyên)
      const userId = req.user.UserID;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Người dùng chưa đăng nhập hoặc phiên đăng nhập không hợp lệ",
        });
      }

      // Gọi model để lấy đơn hàng
      const orders = await orderModel.getOrdersByUserId(userId);

      // Xử lý dữ liệu đơn hàng để hiển thị
      const processedOrders = orders.map((order) => ({
        OrderID: order.OrderID,
        Date: this.formatDate(order.OrderDate),
        Address: order.ShippingAddress,
        OrderValue: this.formatCurrency(order.TotalAmount),
        PaymentStatus: this.getPaymentStatusText(order.PaymentStatus),
        ShippingStatus: this.getShippingStatusText(order.OrderStatus),
      }));

      // Trả về kết quả
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
      const userId = req.user.UserID; // Đã xác thực qua middleware `auth`

      if (!orderId || isNaN(parseInt(orderId))) {
        return res.status(400).json({
          success: false,
          message: "OrderID không hợp lệ",
        });
      }

      // Lấy chi tiết đơn hàng
      const orderDetail = await orderModel.getOrderDetailById(
        parseInt(orderId)
      );

      if (!orderDetail) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy đơn hàng ID: ${orderId}`,
        });
      }

      // // ⚠️ Kiểm tra quyền truy cập: Chỉ user sở hữu mới được xem
      // if (orderDetail.UserID !== userId && req.user.Role !== "Admin") {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Bạn không có quyền xem chi tiết đơn hàng này.",
      //   });
      // }

      // Xử lý dữ liệu để hiển thị
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
          UnitPrice: this.formatCurrency(item.UnitPrice),
          Subtotal: this.formatCurrency(item.Quantity * item.UnitPrice),
          FirstImageUrl: item.FirstImageUrl, // URL ảnh đầu tiên
        })),
      };

      // Trả về kết quả
      return res.status(200).json({ data: processedDetail });
    } catch (error) {
      console.error(" Lỗi khi lấy chi tiết đơn hàng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server không xác định",
        error: error.message,
      });
    }
  };

  // Helper: Chuyển status code thành text
  getPaymentStatusText(status) {
    const statusMap = {
      Pending: "Chưa thanh toán", // Cập nhật từ "Chờ thanh toán"
      Paid: "Đã thanh toán",
      Failed: "Thanh toán thất bại",
      Refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  }

  // Helper: Chuyển shipping status thành text
  getShippingStatusText(status) {
    // Giả định OrderStatus trong DB là trạng thái vận chuyển
    const statusMap = {
      Pending: "Chờ xử lý",
      Confirmed: "Đã xác nhận",
      Packaging: "Đang đóng gói",
      Shipping: "đang vận chuyển", // Cập nhật từ "Đang giao hàng"
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      Returned: "Đã trả hàng",
    };
    return statusMap[status] || status;
  }

  // Helper: Định dạng ngày (DD/MM/YYYY)
  formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Helper: Định dạng tiền tệ (VD: 2.400.000)
  formatCurrency(amount) {
    if (typeof amount !== "number") {
      amount = parseFloat(amount);
    }
    // Sử dụng toLocaleString để định dạng số theo chuẩn Việt Nam
    return amount.toLocaleString("vi-VN", { minimumFractionDigits: 0 });
  }
}

module.exports = new OrderController();
