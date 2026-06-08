import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
  withCredentials: true, // send JWT cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

export default api;
