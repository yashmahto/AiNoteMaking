// ========== AUTH ==========
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}

// ========== NOTES ==========
export interface Note {
  id: string;
  title: string;
  content: string;
  isCompleted: boolean;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteStatus = 'all' | 'pending' | 'completed';

export interface CreateNotePayload {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  appendMode?: boolean;
}

export interface NotesResponse {
  success: boolean;
  notes: Note[];
}

// ========== AGENT ==========
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string | null;
  data?: any;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AgentQueryResponse {
  success: boolean;
  message: string;
  action: string | null;
  data: any;
}

// ========== UI ==========
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
