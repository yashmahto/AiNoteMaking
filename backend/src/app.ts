import express from 'express';
import { prisma } from './lib/prisma.js';
import { success } from 'zod';  

const app = express();

app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'Server is healthy' });
});

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