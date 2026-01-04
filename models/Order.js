const db = require("../config/database");

class OrderModel {
  // Lấy tất cả đơn hàng của user hiện tại-User
  async getOrdersByUserId(userId) {
    try {
      console.log(`📦 Lấy đơn hàng cho UserID: ${userId}`);

      const orders = await db.query(
        `
            SELECT 
                o.OrderID,
                o.OrderCode,
                o.OrderDate,
                o.TotalAmount,
                o.Status AS OrderStatus,
                o.ShippingAddress,
                o.ShippingFee,
                o.PaymentMethod,
                o.PaymentStatus,
                u.FullName
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.UserID
            WHERE o.UserID = ?
            ORDER BY o.OrderDate DESC`,
        [userId]
      );
      console.log(`✅ Tìm thấy ${orders.length} đơn hàng`);
      return orders;
    } catch (error) {
      console.error("❌ Lỗi khi lấy đơn hàng:", error);
      throw error;
    }
  }

  // Lấy chi tiết đơn hàng (bao gồm danh sách sản phẩm) - User
  async getOrderDetailById(orderId) {
    try {
      const orderInfo = await db.query(
        `
            SELECT 
                o.OrderID,
                o.OrderCode,
                o.OrderDate,
                o.TotalAmount,
                o.Status AS OrderStatus,
                o.ShippingAddress,
                o.ShippingFee,
                o.PaymentMethod,
                o.PaymentStatus,
                u.FullName,
                u.Email,
                u.Phone
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.UserID
            WHERE o.OrderID = ?`,
        [orderId]
      );

      if (orderInfo.length === 0) {
        return null;
      }
      const orderItems = await db.query(
        `
            SELECT
                oi.ProductID,
                oi.Quantity,
                oi.UnitPrice,
                p.ProductID,
                p.ProductName,
                p.ProductCode,
                p.ImageURLs,
                p.Color,
                p.Dimensions
            FROM OrderItems oi
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            WHERE oi.OrderID = ?`,
        [orderId]
      );
      return {
        ...orderInfo[0],
        Items: orderItems.map((item) => {
          const imageUrls = JSON.parse(item.ImageURLs || "[]");
          return {
            ProductID: item.ProductID,
            Quantity: item.Quantity,
            UnitPrice: item.UnitPrice,
            ProductName: item.ProductName,
            ProductCode: item.ProductCode,
            Color: item.Color,
            Dimensions: item.Dimensions,
            FirstImageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
          };
        }),
      };
    } catch (error) {
      res.status(500).JSON({
        success: false,
        message: "Lỗi server khi lấy chi tiết đơn hàng",
      });
    }
  }
  //Admin
  async getTotalOrder(status) {
    try {
      const query = `
    SELECT COUNT(*) AS tong_so FROM orders WHERE STATUS != ?
    `;
      const result = await db.query(query, [status]);
      return result.length > 0 ? result[0].tong_so : 0;
    } catch (error) {
      console.error("Lỗi khi lấy tổng đơn:", error);
      throw error;
    }
  }
  async getTodayRevenue() {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(TotalAmount), 0) AS today_revenue,
          COUNT(*) AS today_orders
        FROM Orders 
        WHERE PaymentStatus = 'Paid'
          AND DATE(OrderDate) = CURDATE()
      `;

      const result = await db.query(query);

      return {
        today_revenue: result[0]?.today_revenue || 0,
        today_orders: result[0]?.today_orders || 0,
      };
    } catch (error) {
      console.error("Lỗi khi lấy doanh thu hôm nay:", error);
      throw error;
    }
  }
  //Admin
  async getSoldProductsByPaymentStatus(paymentStatus, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];

      const query = `
      SELECT 
        COALESCE(SUM(oi.Quantity), 0) AS sold_quantity,
        COUNT(DISTINCT oi.ProductID) AS unique_products,
        COUNT(DISTINCT o.OrderID) AS order_count,
        COALESCE(SUM(oi.Quantity * oi.UnitPrice), 0) AS total_amount
      FROM OrderItems oi
      INNER JOIN Orders o ON oi.OrderID = o.OrderID
      WHERE o.PaymentStatus = ?
        AND DATE(o.OrderDate) = DATE(?) 
    `;

      const result = await db.query(query, [paymentStatus, targetDate]);

      return {
        payment_status: paymentStatus,
        date: targetDate,
        sold_quantity: result[0]?.sold_quantity || 0,
        unique_products: result[0]?.unique_products || 0,
        order_count: result[0]?.order_count || 0,
        total_amount: result[0]?.total_amount || 0,
      };
    } catch (error) {
      console.error(
        `Lỗi khi đếm sản phẩm theo trạng thái ${paymentStatus}:`,
        error
      );
      throw error;
    }
  }

  //Admin
  async getDashboardStats(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];

      const query = `
        -- Doanh thu hôm nay (đã thanh toán)
        SELECT 
          COALESCE(SUM(CASE WHEN PaymentStatus = 'Paid' AND DATE(OrderDate) = DATE(?) THEN TotalAmount ELSE 0 END), 0) AS today_revenue,
          
          -- Tổng đơn hàng hôm nay (trừ Pending)
          COUNT(CASE WHEN Status != 'Pending' AND DATE(OrderDate) = DATE(?) THEN 1 END) AS today_total_order,
          
          -- Tổng sản phẩm bán được hôm nay (đã thanh toán)
          COALESCE((
            SELECT SUM(oi.Quantity)
            FROM OrderItems oi
            INNER JOIN Orders o ON oi.OrderID = o.OrderID
            WHERE o.PaymentStatus = 'Paid' 
              AND DATE(o.OrderDate) = DATE(?)
          ), 0) AS today_total_product,
          
          -- Tổng sản phẩm hoàn trả hôm nay
          COALESCE((
            SELECT SUM(oi.Quantity)
            FROM OrderItems oi
            INNER JOIN Orders o ON oi.OrderID = o.OrderID
            WHERE o.PaymentStatus = 'Refunded' 
              AND DATE(o.OrderDate) = DATE(?)
          ), 0) AS today_total_refund_product,
          
          -- Tổng đơn hàng hoàn trả hôm nay
          COUNT(CASE WHEN Status = 'Returned' AND DATE(OrderDate) = DATE(?) THEN 1 END) AS today_total_refund_order
        FROM Orders
        WHERE DATE(OrderDate) = DATE(?)
      `;

      const result = await db.query(query, [
        targetDate, // today_revenue
        targetDate, // today_total_order
        targetDate, // today_total_product
        targetDate, // today_total_refund_product
        targetDate, // today_total_refund_order
        targetDate, // WHERE clause
      ]);

      return {
        today_revenue: result[0]?.today_revenue || 0,
        today_total_order: result[0]?.today_total_order || 0,
        today_total_product: result[0]?.today_total_product || 0,
        today_total_refund_product: result[0]?.today_total_refund_product || 0,
        today_total_refund_order: result[0]?.today_total_refund_order || 0,
        date: targetDate,
      };
    } catch (error) {
      console.error("❌ Lỗi khi lấy thống kê dashboard:", error);
      throw error;
    }
  }

  //Admin
  async getStockCounts(date = null) {
    try {
      const result = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN StockQuantity > 5 THEN 1 ELSE 0 END) as in_stock,
                    SUM(CASE WHEN StockQuantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN StockQuantity > 0 AND StockQuantity <= 5 THEN 1 ELSE 0 END) as low_stock
                FROM products
            `);
      return result[0];
    } catch (error) {
      console.error("Lỗi khi lấy thống kê kho:", error);
      throw error;
    }
  }

  //Admin
  async getTotalRevenueByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(TotalAmount), 0) AS total_revenue
        FROM Orders
        WHERE PaymentStatus = 'Paid'
          AND DATE(OrderDate) BETWEEN DATE(?) AND DATE(?)
      `;

      const result = await db.query(query, [startDate, endDate]);

      // Trả về chỉ số total_revenue
      return result[0]?.total_revenue || 0;
    } catch (error) {
      console.error(
        `Lỗi khi lấy doanh thu từ ${startDate} đến ${endDate}:`,
        error
      );
      throw error;
    }
  }

  //Admin
  async getTotalOrdersByDateRange(startDate, endDate) {
    try {
      const query = `
      SELECT 
        COUNT(*) AS total_orders
      FROM Orders
      WHERE DATE(OrderDate) BETWEEN DATE(?) AND DATE(?)
        AND Status NOT IN ('Pending', 'Cancelled', 'Returned')
    `;

      const result = await db.query(query, [startDate, endDate]);

      return result[0]?.total_orders || 0;
    } catch (error) {
      console.error(
        `❌ Lỗi khi lấy tổng đơn hàng từ ${startDate} đến ${endDate}:`,
        error
      );
      throw error;
    }
  }

  //Admin
  async getTotalCustomersByDateRange(startDate, endDate) {
    try {
      const query = `
      SELECT 
        COUNT(DISTINCT UserID) AS total_customers
      FROM Orders
      WHERE DATE(OrderDate) BETWEEN DATE(?) AND DATE(?)
        AND Status != 'Cancelled'
    `;

      const result = await db.query(query, [startDate, endDate]);

      return result[0]?.total_customers || 0;
    } catch (error) {
      console.error(
        `Lỗi khi lấy tổng khách hàng từ ${startDate} đến ${endDate}:`,
        error
      );
      throw error;
    }
  }
  //Admin
  async getRevenueChartData(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const timeDiff = Math.abs(end - start);
      const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

      // Nếu số ngày <= 10, lấy dữ liệu theo ngày
      if (totalDays <= 10) {
        const query = `
              SELECT 
                DATE(OrderDate) AS date,
                COALESCE(SUM(TotalAmount), 0) AS revenue,
                COUNT(OrderId) AS total_orders
              FROM Orders
              WHERE PaymentStatus = 'Paid'
                AND DATE(OrderDate) BETWEEN DATE(?) AND DATE(?)
              GROUP BY DATE(OrderDate)
              ORDER BY DATE(OrderDate)
            `;

        const result = await db.query(query, [startDate, endDate]);

        const allDates = [];
        const dateMap = {};

        result.forEach((item) => {
          const date = new Date(item.date);
          const dateStr = date.toISOString().split("T")[0];
          dateMap[dateStr] = {
            revenue: item.revenue,
            total_orders: item.total_orders,
          };
        });

        const currentDate = new Date(start);
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split("T")[0];
          allDates.push({
            date: dateStr,
            revenue: dateMap[dateStr]?.revenue || 0,
            total_orders: dateMap[dateStr]?.total_orders || 0,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
          type: "daily",
          interval_days: 1,
          data: allDates,
        };
      } else {
        // Tính số ngày mỗi khoảng
        const intervalDays = Math.ceil(totalDays / 10);

        // Tạo mảng các mốc thời gian
        const intervals = [];
        const intervalPromises = [];

        let currentStart = new Date(start);

        for (let i = 0; i < 10; i++) {
          const intervalEnd = new Date(currentStart);
          intervalEnd.setDate(intervalEnd.getDate() + intervalDays - 1);

          // Đảm bảo không vượt quá ngày kết thúc
          if (intervalEnd > end) {
            intervalEnd.setTime(end.getTime());
          }

          const intervalStartStr = currentStart.toISOString().split("T")[0];
          const intervalEndStr = intervalEnd.toISOString().split("T")[0];

          intervals.push({
            start_date: intervalStartStr,
            end_date: intervalEndStr,
          });

          // Tạo promise cho mỗi khoảng
          intervalPromises.push(
            this.getRevenueForInterval(intervalStartStr, intervalEndStr)
          );

          // Di chuyển đến khoảng tiếp theo
          currentStart.setDate(currentStart.getDate() + intervalDays);
          if (currentStart > end) break;
        }

        // Thực hiện tất cả query cùng lúc
        const revenues = await Promise.all(intervalPromises);

        // Kết hợp dữ liệu
        const chartData = intervals.map((interval, index) => ({
          ...interval,
          report: revenues[index] || 0,
        }));

        return {
          type: "interval",
          interval_days: intervalDays,
          total_intervals: chartData.length,
          data: chartData,
        };
      }
    } catch (error) {
      console.error("❌ Lỗi khi lấy dữ liệu biểu đồ doanh thu:", error);
      throw error;
    }
  }

  // Hàm helper: Lấy doanh thu cho một khoảng thời gian > 10 ngày-Admin
  async getRevenueForInterval(startDate, endDate) {
    try {
      const query = `
      SELECT 
         COALESCE(SUM(TotalAmount), 0) AS revenue,
        COUNT(OrderId) AS total_orders
      FROM Orders
      WHERE PaymentStatus = 'Paid'
        AND DATE(OrderDate) BETWEEN DATE(?) AND DATE(?)
    `;

      const result = await db.query(query, [startDate, endDate]);

      return {
        revenue: result[0]?.revenue || 0,
        total_orders: result[0]?.total_orders || 0,
      };
    } catch (error) {
      console.error(
        `Lỗi khi lấy doanh thu từ ${startDate} đến ${endDate}:`,
        error
      );
      return {
        revenue: result[0]?.revenue || 0,
        total_orders: result[0]?.total_orders || 0,
      };
    }
  }

  // Hàm helper: Tạo label cho khoảng thời gian - Admin
  getIntervalLabel(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}`;
    };

    if (start.toDateString() === end.toDateString()) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  // Hàm helper: Định dạng ngày cho biểu đồ -Admin
  formatChartDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  }
}

module.exports = new OrderModel();
