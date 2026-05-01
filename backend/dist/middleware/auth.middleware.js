import { verifyToken } from "../lib/jwt.js";
export const protect = (req, res, next) => {
    try {
        // Support both cookie-based and Bearer token auth
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
            return;
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};
