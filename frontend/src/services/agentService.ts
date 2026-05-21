import api from './api';
import type { AgentQueryResponse } from '../types';

export const queryAgent = (prompt: string) =>
  api.post<AgentQueryResponse>('/agent/query', { prompt });
