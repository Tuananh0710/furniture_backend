const express = require("express");
const Router = express.Router();
const reviewController = require("../controllers/reviewController");
const { auth } = require("../middlewares/auth");

Router.post("/", auth, reviewController.addReview);
Router.get("/product/:productId", reviewController.getReviews);
Router.get(
  "/product/:productId/average-rating",
  reviewController.calculateAverageRating
);

module.exports = Router;
