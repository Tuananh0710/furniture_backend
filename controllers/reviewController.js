const Review = require("../models/Reviews");

const reviewController = {
  addReview: async (req, res) => {
    try {
      const { orderId, productId, rating, comment } = req.body;
      const userId = req.user.UserID;

      const reviewId = await Review.addReview({
        orderId,
        productId,
        userId,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        message: "Đánh giá đã được thêm thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm đánh giá",
        error: error.message,
      });
    }
  },

  getReviews: async (req, res) => {
    try {
      const productId = req.params.productId;
      const reviews = await Review.getReviews(productId);
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy đánh giá",
        error: error.message,
      });
    }
  },

  calculateAverageRating: async (req, res) => {
    try {
      const productId = req.params.productId;
      const ratingData = await Review.calculateAverageRating(productId);
      res.status(200).json({
        success: true,
        data: ratingData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tính rating tb",
        error: error.message,
      });
    }
  },
};

module.exports = reviewController;
