const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');

const register = async (req, res) => {
    try {
        const { Username, Password, Email, FullName, Phone, Address } = req.body;

        // Check if user exists
        const existingUsers = await query(
            'SELECT UserID FROM Users WHERE Username = ? OR Email = ?',
            [Username, Email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const PasswordHash = await bcrypt.hash(Password, salt);

        // Create user using transaction
        const result = await transaction(async (connection) => {
            // Insert user
            const [userResult] = await connection.execute(
                `INSERT INTO Users (Username, PasswordHash, Email, FullName, Phone, Address, Role) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Member')`,
                [Username, PasswordHash, Email, FullName, Phone, Address]
            );

            // Create cart for user
            await connection.execute(
                'INSERT INTO Carts (UserID) VALUES (?)',
                [userResult.insertId]
            );

            return userResult;
        });

        // Get created user
        const users = await query(
            'SELECT UserID, Username, Email, FullName, Role FROM Users WHERE UserID = ?',
            [result.insertId]
        );

        const user = users[0];

        // Create token
        const token = jwt.sign(
            { userId: user.UserID }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                UserID: user.UserID,
                Username: user.Username,
                Email: user.Email,
                FullName: user.FullName,
                Role: user.Role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const { Username, Password } = req.body;

        // Find user
        const users = await query(
            'SELECT * FROM Users WHERE Username = ? AND IsActive = 1',
            [Username]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(Password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user.UserID }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                UserID: user.UserID,
                Username: user.Username,
                Email: user.Email,
                FullName: user.FullName,
                Role: user.Role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, getProfile };