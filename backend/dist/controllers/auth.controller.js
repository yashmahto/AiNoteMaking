import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { signupSchema, loginSchema } from "../lib/schemas/auth.schema.js";
import { signToken } from "../lib/jwt.js";
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
export const signup = async (req, res) => {
    try {
        const parsedData = signupSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: parsedData.error.format(),
            });
            return;
        }
        const { name, email, password } = parsedData.data;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ success: false, message: "User already exists with this email" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        const token = signToken({ userId: user.id, email: user.email });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { id: user.id, name: user.name, email: user.email },
            token, // Also returning token in response body for flexibility (e.g. mobile apps)
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const login = async (req, res) => {
    try {
        const parsedData = loginSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: parsedData.error.format(),
            });
            return;
        }
        const { email, password } = parsedData.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        const token = signToken({ userId: user.id, email: user.email });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: { id: user.id, name: user.name, email: user.email },
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const logout = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};
export const getMe = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
