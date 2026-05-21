import React, { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, updateNote, deleteNote, markNoteComplete } from '../services/noteService';
import { logout } from '../services/authService';
import type { Note, NoteStatus, CreateNotePayload, UpdateNotePayload, User, AgentMessage } from '../types';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { AiChat } from './AiChat';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  showToast,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NoteStatus>('all');
  const [search, setSearch] = useState('');
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([]);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    setIsNotesLoading(true);
    try {
      const response = await getNotes(filter, search.trim() || undefined);
      if (response.data.success) {
        setNotes(response.data.notes);
      }
    } catch (err: any) {
      console.error('Fetch notes error:', err);
      showToast('Failed to load notes', 'error');
    } finally {
      setIsNotesLoading(false);
    }
  }, [filter, search, showToast]);

  // Debounced search trigger (we can just run it on state change since standard list size is small, or use a small delay)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotes();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filter, search, fetchNotes]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to log out', 'error');
    }
  };

  // Open Create Modal
  const handleCreateOpen = () => {
    setSelectedNote(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEditOpen = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Note
  const handleSaveNote = async (data: CreateNotePayload | UpdateNotePayload) => {
    setIsModalSaving(true);
    try {
      if (selectedNote) {
        // Update
        const response = await updateNote(selectedNote.id, data as UpdateNotePayload);
        if (response.data.success) {
          showToast('Note updated successfully', 'success');
          setIsModalOpen(false);
          fetchNotes();
        }
      } else {
        // Create
        const response = await createNote(data as CreateNotePayload);
        if (response.data.success) {
          showToast('Note created successfully', 'success');
          setIsModalOpen(false);
          fetchNotes();
        }
      }
    } catch (err: any) {
      console.error('Save note error:', err);
      const msg = err.response?.data?.message || 'Failed to save note';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsModalSaving(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      showToast('Note deleted', 'success');
      fetchNotes();
    } catch (err: any) {
      console.error('Delete note error:', err);
      showToast('Failed to delete note', 'error');
    }
  };

  // Toggle Note Completion
  const handleToggleComplete = async (id: string) => {
    try {
      const response = await markNoteComplete(id);
      if (response.data.success) {
        showToast('Note marked as completed', 'success');
        fetchNotes();
      }
    } catch (err: any) {
      console.error('Complete note error:', err);
      showToast('Failed to complete note', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <header className="glass" style={{
        padding: '16px 40px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 900 }}>AiNoteMaking</h1>
          <span className="badge badge-tag">Beta</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        padding: '24px 40px',
        gap: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }} className="dashboard-content-split">
        {/* Left: Notes Dashboard */}
        <section style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minWidth: 0, // Prevent flex items from overflowing
        }}>
          {/* Controls Bar */}
          <div className="glass" style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'pending', 'completed'] as NoteStatus[]).map((status) => (
                <button
                  key={status}
                  className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(status)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px', minWidth: '200px' }}>
              <input
                type="text"
                className="input"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 16px' }}
              />
              <button className="btn btn-primary" onClick={handleCreateOpen}>
                + New Note
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {isNotesLoading && notes.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : notes.length === 0 ? (
              <div className="glass" style={{
                padding: '60px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}>
                <span style={{ fontSize: '48px' }}>📝</span>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Notes Found</h3>
                  <p style={{ fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: '1.6' }}>
                    {search ? 'No notes match your search query. Try another keyword.' : 'Create a note manually or ask the AI Assistant on the right to make one!'}
                  </p>
                </div>
                {!search && (
                  <button className="btn btn-primary" onClick={handleCreateOpen}>
                    Create Your First Note
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 220px)',
                paddingBottom: '24px',
              }} className="notes-grid">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditOpen}
                    onDelete={handleDeleteNote}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: AI Assistant */}
        <section style={{
          width: '380px',
          flexShrink: 0,
        }} className="dashboard-chat-sidebar">
          <AiChat
            messages={chatMessages}
            setMessages={setChatMessages}
            onNotesChange={fetchNotes}
            showToast={showToast}
          />
        </section>
      </main>

      {/* Note Edit/Create Modal */}
      <NoteModal
        note={selectedNote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        isLoading={isModalSaving}
      />
    </div>
  );
};
