const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authenticateToken = require("../middleware/auth");
const { validateCredentials } = require("../middleware/requestValidation");

const router = express.Router();

router.get("/me", authenticateToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({
                message: "User account no longer exists"
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        return next(error);
    }
});

router.post("/register", validateCredentials, async (req, res, next) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({
            email: req.body.email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        return next(error);
    }
});

router.post("/login", validateCredentials, async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email }).select("+password");

        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!process.env.JWT_SECRET) {
            return next(new Error("JWT_SECRET is not configured"));
        }

        const token = jwt.sign(
            { id: user._id.toString() },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;