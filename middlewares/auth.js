const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const auth = async (req, res, next) => {
  try {
    console.log("\n🔐 Auth Middleware Started");
    console.log("Request Path:", req.path);
    console.log("Authorization Header:", req.header("Authorization"));

    // Lấy token từ header
    let token = req.header("Authorization");

    // Kiểm tra và xử lý token
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7); // Bỏ 'Bearer '
    } else if (req.query.token) {
      token = req.query.token; // Lấy từ query string
    }

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "Không có token, truy cập bị từ chối",
      });
    }

    console.log(
      "Token received (first 30 chars):",
      token.substring(0, 30) + "..."
    );

    // Verify token
    let decoded;
    try {
      // Sử dụng JWT_SECRET từ env, nếu không có thì dùng default
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      console.log("✅ Token verified successfully");
      console.log("Decoded payload:", decoded);
    } catch (jwtError) {
      console.log("❌ JWT verification failed:", jwtError.message);
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Kiểm tra decoded có userId không
    if (!decoded || !decoded.userId) {
      console.log("❌ No userId in decoded token");
      console.log("Decoded token:", decoded);
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    // Chuyển đổi userId thành số
    const userId = parseInt(decoded.userId);
    console.log("UserID to query:", userId, "Type:", typeof userId);

    if (isNaN(userId) || userId <= 0) {
      console.log("❌ Invalid UserID format");
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    // Query database
    console.log("Querying database for user ID:", userId);
    const users = await query(
      "SELECT UserID, Username, Email, FullName, Role FROM Users WHERE UserID = ? AND IsActive = 1",
      [userId]
    );

    console.log("Database query result:", users.length, "users found");

    if (users.length === 0) {
      console.log("❌ User not found or inactive in database");
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa",
      });
    }

    // Gán user vào request
    req.user = users[0];
    console.log("✅ User authenticated successfully");
    console.log("User info:", {
      UserID: req.user.UserID,
      Username: req.user.Username,
      Role: req.user.Role,
    });

    console.log("🔐 Auth Middleware Completed\n");
    next();
  } catch (error) {
    console.error("\n❌ Auth middleware error:", error.message);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Lỗi xác thực",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.Role !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Truy cập bị từ chối. Yêu cầu quyền Admin.",
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Xác thực thất bại",
    });
  }
};

const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      await auth(req, res, () => {
        if (!roles.includes(req.user.Role)) {
          return res.status(403).json({
            success: false,
            message: `Truy cập bị từ chối. Yêu cầu quyền: ${roles.join(", ")}`,
          });
        }
        next();
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Xác thực thất bại",
      });
    }
  };
};

module.exports = { auth, adminAuth, authorize };
