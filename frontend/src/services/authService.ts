import api from './api';
import type { AuthResponse } from '../types';

export const signup = (name: string, email: string, password: string) =>
  api.post<AuthResponse>('/auth/signup', { name, email, password });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get<{ success: boolean; user: AuthResponse['user'] }>('/auth/me');
