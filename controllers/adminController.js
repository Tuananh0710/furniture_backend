const order= require('../models/Order');
class adminController{
    static async dashBoard(req, res) {
        try {
            const stats = await order.getDashboardStats;
            
            return res.status(200).json({
                success: true,
                data: {
                    today_revenue: stats.today_revenue,
                    today_total_order: stats.today_total_order,
                    today_total_product: stats.today_total_product,
                    today_total_refund_order: stats.today_total_refund_order
                },
                date: stats.date
            });
        } catch (error) {
            console.error("Get dashboard error:", error);
            res.status(500).json({
                success: false,
                message: "Server error when getting information",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }
}

module.exports=adminController;