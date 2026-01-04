const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { auth } = require("../middlewares/auth");

router.use(auth);

router.get("/inf", checkoutController.getCheckout);
router.post("/place-order", checkoutController.placeOrder);

module.exports = router;
