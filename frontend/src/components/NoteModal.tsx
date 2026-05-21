import React, { useState, useEffect } from 'react';
import type { Note, CreateNotePayload, UpdateNotePayload } from '../types';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateNotePayload | UpdateNotePayload) => Promise<void>;
  isLoading: boolean;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setTagsInput(note.tags ? note.tags.join(', ') : '');
    } else {
      setTitle('');
      setContent('');
      setTagsInput('');
    }
    setError('');
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (note) {
        await onSave({
          title: title.trim(),
          content: content.trim(),
          // Backend updateNote controller takes title, content, appendMode.
          // Let's pass title and content.
        } as UpdateNotePayload);
      } else {
        await onSave({
          title: title.trim(),
          content: content.trim(),
          tags,
        } as CreateNotePayload);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{note ? 'Edit Note' : 'Create Note'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={isLoading}>
            ✗
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label" htmlFor="note-title">Title</label>
              <input
                id="note-title"
                className={`input ${error ? 'input-error' : ''}`}
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
              {error && <span className="field-error">{error}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="note-content">Content</label>
              <textarea
                id="note-content"
                className="input"
                placeholder="Start writing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                style={{ minHeight: '140px' }}
              />
            </div>

            {!note && (
              <div className="input-group">
                <label className="input-label" htmlFor="note-tags">Tags (comma separated)</label>
                <input
                  id="note-tags"
                  className="input"
                  type="text"
                  placeholder="e.g. work, personal, ideas"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner" /> : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
