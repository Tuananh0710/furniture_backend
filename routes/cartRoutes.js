const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cartController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Cart routes are working!" });
});

// Main route
router.get("/:id", CartController.findByUser);

module.exports = router;
