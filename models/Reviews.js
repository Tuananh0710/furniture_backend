const { query } = require("../config/database");

class Review {
  static async addReview({ orderId, productId, userId, rating, comment }) {
    const result = await query(
      `
            INSERT INTO reviews (OrderID, ProductID, UserID, Rating, Comment, CreatedAt)
            VALUES (?, ?, ?, ?, ?, CurDate())
        `,
      [orderId, productId, userId, rating, comment]
    );
    return result.insertId;
  }

  static async getReviews(productId) {
    const reviews = await query(
      `
      SELECT 
        r.*,
        u.FullName
      FROM reviews r
      LEFT JOIN users u ON r.UserID = u.UserID
      WHERE r.ProductID = ? AND r.IsApproved = TRUE
      ORDER BY r.CreatedAt DESC
    `,
      [productId]
    );

    return reviews;
  }

  static async calculateAverageRating(productId) {
    const reviews = await query(
      `
    SELECT Rating FROM reviews 
    WHERE ProductID = ? AND IsApproved = TRUE
    `,
      [productId]
    );

    const allRatings = reviews.map((review) => review.Rating);
    if (reviews.length === 0) {
      return {
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          starCounts: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
          allRatings: [],
        },
      };
    }
    const avgRating =
      allRatings.reduce((sum, rating) => sum + rating, 0) / reviews.length;
    const starCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    allRatings.forEach((rating) => {
      if (rating >= 1 && rating <= 5) {
        starCounts[rating.toString()] += 1;
      }
    });
    return {
      success: true,
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        starCounts: starCounts,
      },
    };
  }
}

module.exports = Review;
