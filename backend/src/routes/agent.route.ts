import { Router } from "express";
import { handleQuery } from "../controllers/agent.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { agentRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Route to query the AI Agent
router.post("/query", protect, agentRateLimiter, handleQuery);

export default router;
