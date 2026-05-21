import api from './api';
import type { CreateNotePayload, UpdateNotePayload, NotesResponse, Note, NoteStatus } from '../types';

export const getNotes = (status: NoteStatus = 'all', search?: string) => {
  const params: Record<string, string> = { status };
  if (search) params.search = search;
  return api.get<NotesResponse>('/notes', { params });
};

export const createNote = (data: CreateNotePayload) =>
  api.post<{ success: boolean; note: Note }>('/notes', data);

export const updateNote = (id: string, data: UpdateNotePayload) =>
  api.put<{ success: boolean; note: Note }>(`/notes/${id}`, data);

export const deleteNote = (id: string) =>
  api.delete(`/notes/${id}`);

export const markNoteComplete = (id: string) =>
  api.patch<{ success: boolean; note: Note }>(`/notes/${id}/complete`);
