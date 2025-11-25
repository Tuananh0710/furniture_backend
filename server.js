// Đảm bảo import app đúng cách
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        console.log('🚀 Starting Furniture Store Server...');
        
        // Test database connection
        const isConnected = await testConnection();
        
        if (!isConnected) {
            console.log('⚠️  Starting server without database connection...');
        } else {
            console.log('✅ Database connection established');
        }

        // Kiểm tra app có phải là Express app không
        if (typeof app.listen !== 'function') {
            throw new Error('app is not a valid Express application');
        }

        // Khởi động server
        app.listen(PORT, () => {
            console.log(`🎉 Server is running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📊 Test route: http://localhost:${PORT}/api/test`);
            console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('💡 Kiểm tra file app.js có export đúng không');
        process.exit(1);
    }
};

startServer();