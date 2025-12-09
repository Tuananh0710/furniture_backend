const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, transaction } = require("../config/database");

const register = async (req, res) => {
  try {
    const { Username, Password, Email, FullName, Phone, Address } = req.body;

    // Check if user exists
    const existingUsers = await query(
      "SELECT UserID FROM Users WHERE Username = ? OR Email = ?",
      [Username, Email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const PasswordHash = await bcrypt.hash(Password, salt);

    // Create user using transaction
    const result = await transaction(async (connection) => {
      // Insert user
      const [userResult] = await connection.execute(
        `INSERT INTO Users (Username, PasswordHash, Email, FullName, Phone, Address, Role) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Member')`,
        [Username, PasswordHash, Email, FullName, Phone, Address]
      );

      // Create cart for user
      await connection.execute("INSERT INTO Carts (UserID) VALUES (?)", [
        userResult.insertId,
      ]);

      return userResult;
    });

    // Get created user
    const users = await query(
      "SELECT UserID, Username, Email, FullName, Role FROM Users WHERE UserID = ?",
      [result.insertId]
    );

    const user = users[0];

    // Create token
    const token = jwt.sign({ userId: user.UserID }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        Email: user.Email,
        FullName: user.FullName,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const login = async (req, res) => {
  try {
    const { Username, Password } = req.body;

    // Find user
    const users = await query(
      "SELECT * FROM Users WHERE Username = ? AND IsActive = 1",
      [Username]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // DEBUG: Kiểm tra user.UserID
    console.log("Creating token for user:", {
      UserID: user.UserID,
      Type: typeof user.UserID,
      Username: user.Username,
    });

    // Create token - ĐẢM BẢO userId là số
    const token = jwt.sign(
      {
        userId: user.UserID, // Đảm bảo đây là số
        username: user.Username,
        role: user.Role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    console.log("Token created successfully");
    console.log("Token (first 50 chars):", token.substring(0, 50) + "...");

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        Email: user.Email,
        FullName: user.FullName,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};
q;

const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT UserID, Username, Email, FullName, Role FROM Users WHERE UserID = ? AND IsActive = 1",
      [id]
    );
    if (result.length === 0) {
      return res.statas(401).json({
        success: false,
        message: "loi khi lay thong tin user",
      });
    }
    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getProfile };
