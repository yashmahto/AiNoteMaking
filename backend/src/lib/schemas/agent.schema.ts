import { z } from "zod";

export const agentQuerySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt is too long (max 1000 characters)"),
});
