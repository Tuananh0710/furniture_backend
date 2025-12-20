const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cartController");

router.get("/test", (req, res) => {
  res.json({ message: "Cart routes are working!" });
});

router.get("/:id", CartController.findByUser);
router.post("/add", CartController.addItem);
router.put("/update-quantity", CartController.updateItemQuantity);
router.delete("/remove", CartController.removeItem);

module.exports = router;
