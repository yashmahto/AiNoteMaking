import React from 'react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`card ${note.isCompleted ? 'completed-note-card' : ''}`} style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      height: '100%',
      justifyContent: 'space-between',
      opacity: note.isCompleted ? 0.75 : 1,
      transition: 'var(--transition)',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: note.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: note.isCompleted ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}>
            {note.title}
          </h4>
          <span className={`badge ${note.isCompleted ? 'badge-completed' : 'badge-pending'}`}>
            {note.isCompleted ? 'Done' : 'Pending'}
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginBottom: '12px',
        }}>
          {note.content}
        </p>
      </div>

      <div>
        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {note.tags.map((tag) => (
              <span key={tag} className="badge badge-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          marginTop: 'auto',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {formattedDate}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!note.isCompleted && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onToggleComplete(note.id)}
                title="Mark Completed"
                style={{ color: 'var(--success)', padding: '6px 10px' }}
              >
                ✓ Complete
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(note)}
              title="Edit Note"
              style={{ padding: '6px 10px' }}
            >
              Edit
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(note.id)}
              title="Delete Note"
              style={{ color: 'var(--error)', padding: '6px 10px' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
