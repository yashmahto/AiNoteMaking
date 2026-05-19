import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4001/api',
  withCredentials: true, // send JWT cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

export default api;
