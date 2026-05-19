import { Request, Response, NextFunction } from "express";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const agentRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 15; // 15 requests per minute

  const rateData = rateLimitMap.get(ip);

  if (!rateData || now > rateData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + limitWindow });
    next();
    return;
  }

  if (rateData.count >= maxRequests) {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down and try again in a minute.",
    });
    return;
  }

  rateData.count += 1;
  next();
};
