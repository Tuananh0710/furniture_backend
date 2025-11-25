const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const users = await query(
            'SELECT UserID, Username, Email, FullName, Role FROM Users WHERE UserID = ? AND IsActive = 1',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user.Role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Admin required.' });
            }
            next();
        });
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Hàm authorize mới - tương thích với code của bạn
const authorize = (roles = []) => {
    return async (req, res, next) => {
        try {
            // Gọi auth middleware trước
            await auth(req, res, () => {
                // Kiểm tra quyền
                if (!roles.includes(req.user.Role)) {
                    return res.status(403).json({ 
                        message: `Access denied. Required roles: ${roles.join(', ')}` 
                    });
                }
                next();
            });
        } catch (error) {
            res.status(401).json({ message: 'Authentication failed' });
        }
    };
};

module.exports = { auth, adminAuth, authorize };