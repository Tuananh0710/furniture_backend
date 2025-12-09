const jwt = require("jsonwebtoken");

// Test 1: Kiểm tra JWT_SECRET
console.log("=== DEBUG AUTH ===");
console.log("JWT_SECRET from env:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("JWT_EXPIRES_IN from env:", process.env.JWT_EXPIRES_IN);

// Test 2: Tạo và verify token
const testPayload = {
  userId: 4,
  username: "testuser",
  role: "Member",
};

console.log("\n=== Creating test token ===");
const testToken = jwt.sign(
  testPayload,
  process.env.JWT_SECRET || "your-secret-key",
  {
    expiresIn: "7d",
  }
);

console.log("Test token created:", testToken.substring(0, 50) + "...");

// Test 3: Verify token
console.log("\n=== Verifying test token ===");
try {
  const decoded = jwt.verify(
    testToken,
    process.env.JWT_SECRET || "your-secret-key"
  );
  console.log("✅ Token verified successfully");
  console.log("Decoded payload:", decoded);
  console.log("userId:", decoded.userId, "Type:", typeof decoded.userId);
} catch (error) {
  console.log("❌ Token verification failed:", error.message);
}

// Test 4: Decode without verification (just to see payload)
console.log("\n=== Decoding token (no verify) ===");
const decodedWithoutVerify = jwt.decode(testToken);
console.log("Decoded (no verify):", decodedWithoutVerify);
