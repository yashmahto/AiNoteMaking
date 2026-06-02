import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { AgentService } from "../aiAgent/agent.js";
import { agentQuerySchema } from "../lib/schemas/agent.schema.js";

const agentService = new AgentService();

function sanitizePrompt(input: string): string {
  const blacklist = /ignore previous|system prompt|you are now|act as/gi;
  return input.replace(blacklist, "[REMOVED]");
}

export const handleQuery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
      return;
    }

    const parsedData = agentQuerySchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: parsedData.error.format(),
      });
      return;
    }

    const sanitizedPrompt = sanitizePrompt(parsedData.data.prompt);

    const result = await agentService.processQuery(userId, sanitizedPrompt);

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Agent query error:", error);
    if (error.status === 429) {
      res.status(429).json({
        success: false,
        message: "Gemini API quota exceeded or rate limited. Please try again shortly.",
      });
      return;
    }
    if (error.status === 503) {
      res.status(503).json({
        success: false,
        message: "Gemini API is currently experiencing high demand. Please try again shortly.",
      });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
