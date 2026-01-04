const checkoutModel = require("../models/checkout");

class CheckoutController {
  // Lấy thông tin checkout
  getCheckout = async (req, res) => {
    try {
      const userId = req.user.UserID;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Người dùng chưa đăng nhập",
        });
      }

      const cartItems = await checkoutModel.getCartItemsSimple(userId);

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Giỏ hàng trống",
        });
      }

      const userInfo = await checkoutModel.getUserInfo(userId);

      const subtotal = cartItems.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      const shippingFee = 10;
      const totalAmount = subtotal + shippingFee;

      res.json({
        success: true,
        data: {
          userInfo: {
            fullName: userInfo.FullName || "",
            phone: userInfo.Phone || "",
            address: userInfo.Address || "",
          },
          cartItems: cartItems.map((item) => ({
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            imageUrl:
              item.imageUrls && item.imageUrls.length > 0
                ? item.imageUrls[0]
                : null,
            subtotal: item.price * item.quantity,
          })),
          summary: {
            subtotal: subtotal,
            shippingFee: shippingFee,
            totalAmount: totalAmount,
            itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          },
          shippingMethods: [
            { id: "express", name: "Sapo Express - J&T Express", fee: 10 },
          ],
          paymentMethods: [{ id: "cod", name: "Cash on Delivery (COD)" }],
        },
      });
    } catch (error) {
      console.error(" Lỗi khi lấy thông tin checkout:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin checkout",
      });
    }
  };

  // Xử lý đặt hàng
  placeOrder = async (req, res) => {
    try {
      console.log(" Body nhận được:", req.body);
      console.log(" Headers:", req.headers);

      const userId = req.user.UserID;

      // Kiểm tra xem có body không
      //   if (!req.body) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "Không nhận được dữ liệu từ client",
      //     });
      //   }

      // Sử dụng destructuring với giá trị mặc định
      const {
        shippingAddress = "",
        phone = "",
        fullName = "",
        notes = "",
        paymentMethod = "cod",
      } = req.body;

      const requiredFields = [];
      if (!shippingAddress.trim()) requiredFields.push("shippingAddress");
      if (!phone.trim()) requiredFields.push("phone");
      if (!fullName.trim()) requiredFields.push("fullName");
      if (requiredFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ thông tin giao hàng",
          missingFields: requiredFields,
          fieldLabels: {
            shippingAddress: "Địa chỉ giao hàng",
            phone: "Số điện thoại",
            fullName: "Họ và tên",
          },
        });
      }

      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại không đúng định dạng",
          hint: "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 10 số",
        });
      }

      // 1. Lấy giỏ hàng
      const cartItems = await checkoutModel.getCartItemsSimple(userId);

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Giỏ hàng trống",
        });
      }

      // 2. Kiểm tra tồn kho
      for (const item of cartItems) {
        if (item.quantity > item.stockQuantity) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm "${item.productName}" chỉ còn ${item.stockQuantity} sản phẩm`,
          });
        }
      }

      // 3. Tính toán tổng tiền
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
      const shippingFee = 10;
      const totalAmount = subtotal + shippingFee;

      const deliveryNotes = "";

      const orderData = {
        userId,
        totalAmount,
        shippingAddress: `${shippingAddress}`,
        shippingFee,
        paymentMethod: this.getPaymentMethodName(paymentMethod),
        notes: deliveryNotes,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          productName: item.productName,
        })),
        customerInfo: {
          fullName,
          phone,
        },
      };

      const orderResult = await checkoutModel.createOrder(orderData);

      await this.updateUserInfo(userId, { fullName, phone });

      res.json({
        success: true,
        message: "Đặt hàng thành công!",
        data: {
          orderId: orderResult.orderId,
          orderCode: orderResult.orderCode,
          totalAmount: totalAmount,
          customerInfo: { fullName, phone },
          redirectUrl: `/orders/${orderResult.orderId}`,
        },
      });
    } catch (error) {
      console.error(" Lỗi khi đặt hàng:", error);
      if (
        error.message.includes("StockQuantity") ||
        error.message.includes("không đủ")
      ) {
        return res.status(400).json({
          success: false,
          message: "Số lượng sản phẩm trong kho không đủ",
          details: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi server khi đặt hàng",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  async updateUserInfo(userId, userData) {
    try {
      const db = require("../config/database");
      const connection = await db.pool.getConnection();

      const updates = [];
      const params = [];

      if (userData.fullName) {
        updates.push("FullName = ?");
        params.push(userData.fullName);
      }
      if (userData.phone) {
        updates.push("Phone = ?");
        params.push(userData.phone);
      }

      if (updates.length > 0) {
        params.push(userId);
        await connection.query(
          `UPDATE users SET ${updates.join(", ")} WHERE UserID = ?`,
          params
        );
      }

      await connection.release();
    } catch (error) {
      console.error(" Lỗi khi cập nhật thông tin người dùng:", error);
    }
  }

  getPaymentMethodName(methodId) {
    const methods = {
      cod: "Cash",
      cash: "Cash",
      bank: "BankTransfer",
    };
    return methods[methodId] || "Cash";
  }
}

module.exports = new CheckoutController();
