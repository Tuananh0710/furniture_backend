const express = require("express");
const {
  register,
  login,
  getProfile,
  changePassword,
} = require("../controllers/authcontroller");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/:id/profile", auth, getProfile);
router.post("/changePassword", auth, changePassword);

module.exports = router;
