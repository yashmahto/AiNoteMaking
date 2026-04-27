import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});
import { PrismaClient } from "../generated/prisma/client.js";
export const prisma = new PrismaClient();
