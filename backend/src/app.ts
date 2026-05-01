import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'Server is healthy' });
});

app.use('/api/auth', authRoutes);

app.get('/test', async (req, res) => {  
  try{
    const notes = await prisma.note.findMany();
    return res.status(200).json({
      success: true,
      data: notes,
    });
  }catch(error){
    console.error('Error in /test route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
export { app };