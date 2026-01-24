import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Create token
        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username },
            process.env.JWT_SECRET || 'secret_key_123', // Fallback for dev
            { expiresIn: '1h' }
        );

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                isPremium: savedUser.isPremium
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '1day' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get User Data (Protected)
router.get('/user', async (req, res) => {
    // Simple verification middleware inline for now, can be extracted
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
});

export default router;
