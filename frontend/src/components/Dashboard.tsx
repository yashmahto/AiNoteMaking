import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNotes, createNote, updateNote, deleteNote, markNoteComplete } from '../services/noteService';
import { logout } from '../services/authService';
import { queryAgent } from '../services/agentService';
import type { Note, NoteStatus, User, AgentMessage } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AVATAR_OPTIONS = ['🦊', '🐼', '🐸', '🐱', '🦄', '🐨', '🦁', '🐙'];

const BADGE_COLOR_OPTIONS = [
  { id: 'coral', bgClass: 'bg-coral', hex: '#FF6B6B', label: 'Coral' },
  { id: 'sunshine', bgClass: 'bg-sunshine', hex: '#FFE66D', label: 'Yellow' },
  { id: 'mint', bgClass: 'bg-mint', hex: '#4ECDC4', label: 'Mint' },
  { id: 'sky', bgClass: 'bg-sky', hex: '#70D6FF', label: 'Sky' },
  { id: 'lavender', bgClass: 'bg-lavender', hex: '#C77DFF', label: 'Lavender' },
];

const NOTE_COLOR_MAP: Record<string, { bg: string; pill: string }> = {
  sunshine: { bg: 'bg-sunshine', pill: 'bg-white' },
  mint: { bg: 'bg-mint', pill: 'bg-white' },
  coral: { bg: 'bg-coral/85', pill: 'bg-white' },
  sky: { bg: 'bg-sky', pill: 'bg-white' },
  lavender: { bg: 'bg-lavender/75', pill: 'bg-white' },
};

const NOTE_COLOR_CYCLE = ['sunshine', 'mint', 'coral', 'sky', 'lavender'];

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  showToast,
}) => {
  // ================= State: Notes =================
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NoteStatus>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // Note colors mapping per note id: noteId -> color
  const [noteColors, setNoteColors] = useState<Record<string, string>>({});

  // ================= State: User Customization =================
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('chirp_user_name') || user.name || 'Sunny Fox';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('chirp_user_avatar') || '🦊';
  });
  const [userColorId, setUserColorId] = useState<string>(() => {
    return localStorage.getItem('chirp_user_color') || 'coral';
  });
  const [celebrationsOn, setCelebrationsOn] = useState<boolean>(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // ================= State: Modal (Create / Edit) =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNoteId, setModalNoteId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalTag, setModalTag] = useState('errands');
  const [modalColor, setModalColor] = useState('sunshine');
  const [isModalSaving, setIsModalSaving] = useState(false);

  // ================= State: AI Assistant =================
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Hi ${user.name || 'there'}! I'm your Chirp AI Buddy. Tell me to jot down a new note, check off a finished errand, add items to an existing note, or find notes for you!`,
      action: '✨ Ready for your voice or text',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const speechRecognitionRef = useRef<any>(null);
  const voiceSilenceTimerRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>('');
  const isVoiceListeningRef = useRef<boolean>(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Cleanup speech recognition and silence timer on unmount
  useEffect(() => {
    return () => {
      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Get active badge color
  const activeColorObj =
    BADGE_COLOR_OPTIONS.find((c) => c.id === userColorId) || BADGE_COLOR_OPTIONS[0];

  // Save profile changes
  const handleAvatarChange = (emoji: string) => {
    setUserAvatar(emoji);
    localStorage.setItem('chirp_user_avatar', emoji);
    if (celebrationsOn) spawnSparkleBurst(emoji);
  };

  const handleColorChange = (colorId: string) => {
    setUserColorId(colorId);
    localStorage.setItem('chirp_user_color', colorId);
  };

  const handleNameChange = (nameVal: string) => {
    setUserName(nameVal);
    localStorage.setItem('chirp_user_name', nameVal);
  };

  // Sparkle burst helper
  const spawnSparkleBurst = (symbol = '✨') => {
    const symbols = [symbol, '✨', '🌟', '🎉', '💛'];
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle-burst text-2xl sm:text-3xl';
      el.style.left = `${25 + Math.random() * 50}%`;
      el.style.top = `${35 + Math.random() * 35}%`;
      el.textContent = symbols[i % symbols.length];
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  // Fetch Notes from Backend
  const fetchNotes = useCallback(async () => {
    setIsNotesLoading(true);
    try {
      const response = await getNotes(filter, search.trim() || undefined);
      if (response.data.success) {
        setNotes(response.data.notes);

        // Assign colors to newly discovered notes if not present
        setNoteColors((prev) => {
          const updated = { ...prev };
          response.data.notes.forEach((note: Note, idx: number) => {
            if (!updated[note.id]) {
              updated[note.id] = NOTE_COLOR_CYCLE[idx % NOTE_COLOR_CYCLE.length];
            }
          });
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Fetch notes error:', err);
      showToast('Failed to load notes', 'error');
    } finally {
      setIsNotesLoading(false);
    }
  }, [filter, search, showToast]);

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
      showToast('Signed out safely! Come back soon 🌻', 'info');
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to log out', 'error');
    }
  };

  // Open Create Note Modal
  const openCreateModal = () => {
    setModalNoteId(null);
    setModalTitle('');
    setModalContent('');
    setModalTag('errands');
    setModalColor(NOTE_COLOR_CYCLE[Math.floor(Math.random() * NOTE_COLOR_CYCLE.length)]);
    setIsModalOpen(true);
  };

  // Open Edit Note Modal
  const openEditModal = (note: Note) => {
    setModalNoteId(note.id);
    setModalTitle(note.title);
    setModalContent(note.content || '');
    setModalTag(note.tags && note.tags.length > 0 ? note.tags[0] : 'errands');
    setModalColor(noteColors[note.id] || 'sunshine');
    setIsModalOpen(true);
  };

  // Save (Create or Update) Note
  const handleSaveModalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    setIsModalSaving(true);
    try {
      if (modalNoteId) {
        // Update existing note
        const res = await updateNote(modalNoteId, {
          title: modalTitle.trim(),
          content: modalContent.trim(),
        });
        if (res.data.success) {
          setNoteColors((prev) => ({ ...prev, [modalNoteId]: modalColor }));
          showToast(`Note updated: "${modalTitle}"`, 'success');
          setIsModalOpen(false);
          fetchNotes();
        }
      } else {
        // Create new note
        const res = await createNote({
          title: modalTitle.trim(),
          content: modalContent.trim(),
          tags: [modalTag],
        });
        if (res.data.success) {
          const newId = res.data.note.id;
          setNoteColors((prev) => ({ ...prev, [newId]: modalColor }));
          showToast(`Pinned "${modalTitle}" to your board! 📌`, 'success');
          if (celebrationsOn) spawnSparkleBurst('📌');
          setIsModalOpen(false);
          fetchNotes();
        }
      }
    } catch (err: any) {
      console.error('Save note error:', err);
      const msg = err.response?.data?.message || 'Failed to save note';
      showToast(msg, 'error');
    } finally {
      setIsModalSaving(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string, title: string) => {
    if (!window.confirm(`Take "${title}" off your board?`)) return;
    try {
      await deleteNote(id);
      showToast(`"${title}" was taken off your board`, 'info');
      fetchNotes();
    } catch (err: any) {
      console.error('Delete note error:', err);
      showToast('Failed to delete note', 'error');
    }
  };

  // Toggle Note Completion
  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    try {
      const res = await markNoteComplete(id);
      if (res.data.success) {
        if (!currentCompleted && celebrationsOn) {
          spawnSparkleBurst('🎉');
          showToast('🎉 Note checked off! Great job!', 'success');
        } else {
          showToast('Note status updated', 'info');
        }
        fetchNotes();
      }
    } catch (err: any) {
      console.error('Toggle complete note error:', err);
      showToast('Failed to update note status', 'error');
    }
  };

  // Cycle Note Color
  const handleCycleColor = (id: string) => {
    const currentColor = noteColors[id] || 'sunshine';
    const nextIdx = (NOTE_COLOR_CYCLE.indexOf(currentColor) + 1) % NOTE_COLOR_CYCLE.length;
    const nextColor = NOTE_COLOR_CYCLE[nextIdx];
    setNoteColors((prev) => ({ ...prev, [id]: nextColor }));
  };

  // AI Assistant Chat & Query
  const sendPromptToAi = async (promptText: string) => {
    const raw = promptText.trim();
    if (!raw || isAiLoading) return;

    // Append user message
    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: raw,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await queryAgent(raw);
      if (res.data.success) {
        const botMsg: AgentMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.data.message,
          action: res.data.action ? `✨ Ran: ${res.data.action}` : null,
          data: res.data.data,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, botMsg]);

        // If an action was taken by the AI agent (create, update, mark_completed, etc.), refresh notes!
        if (res.data.action) {
          fetchNotes();
          if (celebrationsOn) spawnSparkleBurst('✨');
        }
      }
    } catch (err: any) {
      console.error('AI Query error:', err);
      const errMsg =
        err.response?.data?.message || 'My note assistant encountered a temporary hiccup. Please try again!';
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Voice Recognition Handler with Full Sentence Buffering & Auto-Send Debounce
  const toggleVoiceRecognition = () => {
    if (isVoiceListening) {
      // User manually stopped / wants to send
      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
        voiceSilenceTimerRef.current = null;
      }
      setIsVoiceListening(false);
      isVoiceListeningRef.current = false;
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }

      const textToSend = voiceTranscriptRef.current.trim() || chatInput.trim();
      if (textToSend) {
        voiceTranscriptRef.current = '';
        sendPromptToAi(textToSend);
      } else {
        showToast('Voice listening stopped', 'info');
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = null;
    }
    voiceTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsVoiceListening(true);
        isVoiceListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        fullTranscript = fullTranscript.trim();

        if (fullTranscript) {
          voiceTranscriptRef.current = fullTranscript;
          setChatInput(fullTranscript);

          // Clear previous silence timer and wait 1.8s of silence after speaking full sentence
          if (voiceSilenceTimerRef.current) {
            clearTimeout(voiceSilenceTimerRef.current);
          }

          voiceSilenceTimerRef.current = setTimeout(() => {
            if (isVoiceListeningRef.current) {
              isVoiceListeningRef.current = false;
              setIsVoiceListening(false);
              try {
                recognition.stop();
              } catch (e) {}

              const capturedText = voiceTranscriptRef.current.trim();
              if (capturedText) {
                voiceTranscriptRef.current = '';
                sendPromptToAi(capturedText);
              }
            }
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        // 'no-speech' happens when user pauses or before speaking, do not cancel or send fake request!
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        console.warn('Speech recognition status:', event.error);
        if (voiceSilenceTimerRef.current) {
          clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = null;
        }
        setIsVoiceListening(false);
        isVoiceListeningRef.current = false;

        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Please allow microphone in browser.', 'error');
        } else {
          showToast(`Microphone notice: ${event.error}`, 'info');
        }
      };

      recognition.onend = () => {
        if (isVoiceListeningRef.current) {
          // If browser naturally ended session while listening, send whatever sentence was gathered
          const capturedText = voiceTranscriptRef.current.trim();
          setIsVoiceListening(false);
          isVoiceListeningRef.current = false;
          if (voiceSilenceTimerRef.current) {
            clearTimeout(voiceSilenceTimerRef.current);
            voiceSilenceTimerRef.current = null;
          }
          if (capturedText) {
            voiceTranscriptRef.current = '';
            sendPromptToAi(capturedText);
          }
        } else {
          setIsVoiceListening(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Recognition start error:', err);
      showToast('Could not start speech recognition', 'error');
      setIsVoiceListening(false);
      isVoiceListeningRef.current = false;
    }
  };

  // Reset AI Conversation
  const resetAiConversation = () => {
    setChatMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Conversation refreshed! What can I help you organize or find next, ${userName}?`,
        action: '✨ Ready for your voice or text',
        timestamp: new Date(),
      },
    ]);
    showToast('🧹 Conversation refreshed!', 'info');
  };

  // Note counts
  const totalNotesCount = notes.length;
  const pendingNotesCount = notes.filter((n) => !n.isCompleted).length;
  const doneNotesCount = notes.filter((n) => n.isCompleted).length;

  // Filtered notes by tag, status, and local instant search
  const filteredNotes = notes.filter((n) => {
    const matchesTag =
      tagFilter === 'all' || (n.tags && n.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
    const matchesStatus =
      filter === 'all' ? true : filter === 'completed' ? n.isCompleted : !n.isCompleted;
    const cleanSearch = search.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      n.title.toLowerCase().includes(cleanSearch) ||
      (n.content && n.content.toLowerCase().includes(cleanSearch)) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(cleanSearch)));
    return matchesTag && matchesStatus && matchesSearch;
  });

  // Extract all unique tags
  const allUniqueTags = Array.from(
    new Set(notes.flatMap((n) => (n.tags && n.tags.length > 0 ? n.tags : ['errands'])))
  );

  return (
    <div className="bg-cream text-charcoal bg-stationery-dots min-h-screen flex flex-col relative antialiased selection:bg-sunshine selection:text-charcoal">
      {/* Soft Decorative Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-sunshine/35 blur-3xl animate-float-slow" />
        <div className="absolute top-32 -right-20 w-72 h-72 rounded-full bg-coral/20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-16 left-1/4 w-80 h-80 rounded-full bg-mint/25 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-16 right-10 w-80 h-80 rounded-full bg-lavender/25 blur-3xl animate-float-delayed" />
      </div>

      {/* =========================================================
           1. WORKSPACE STICKY NAVIGATION BAR WITH USER PROFILE ICON
      ========================================================== */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b-[2.5px] border-charcoal px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: ChirpNotes Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sunshine tactile-btn flex items-center justify-center">
              <svg className="w-7 h-7 text-charcoal" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="8" width="28" height="32" rx="7" fill="#FF6B6B" stroke="#1E1B18" stroke-width="3.2" />
                <rect x="24" y="14" width="16" height="22" rx="8" fill="#4ECDC4" stroke="#1E1B18" stroke-width="3.2" />
                <circle cx="16" cy="21" r="2.2" fill="#1E1B18" />
                <circle cx="23" cy="21" r="2.2" fill="#1E1B18" />
                <path d="M16.5 26C17.8 28.2 21.2 28.2 22.5 26" stroke="#1E1B18" stroke-width="2.6" stroke-linecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl sm:text-2xl text-charcoal">ChirpNotes</span>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-mint/40 border-2 border-charcoal text-[11px] font-extrabold">
                  ✨ Personal Note Studio
                </span>
              </div>
              <p className="text-[11px] font-bold text-charcoal/65 hidden sm:block">
                Speak or type to your AI Buddy on the left!
              </p>
            </div>
          </div>

          {/* Center: Live Note Progress Pills */}
          <div className="hidden lg:flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-2xl border-[2.5px] border-charcoal shadow-[3px_3px_0px_#1E1B18]">
            <div className="px-2.5 py-1 rounded-xl bg-sunshine/50 border border-charcoal text-xs font-extrabold flex items-center gap-1.5">
              <span>📝</span>
              <span>{totalNotesCount} Total</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-sky/40 border border-charcoal text-xs font-extrabold flex items-center gap-1.5">
              <span>⏳</span>
              <span>{pendingNotesCount} To Do</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-mint/50 border border-charcoal text-xs font-extrabold flex items-center gap-1.5">
              <span>🎉</span>
              <span>{doneNotesCount} Done</span>
            </div>
          </div>

          {/* Right: Quick New Note Button + PROMINENT USER PROFILE ICON & POPOVER */}
          <div className="flex items-center gap-3 relative" ref={profileMenuRef}>
            <button
              onClick={openCreateModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sunshine hover:bg-[#ffdf4d] text-charcoal font-display font-bold text-xs sm:text-sm tactile-btn"
            >
              <i className="fa-solid fa-plus text-coral" />
              <span>Write a Note</span>
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-2xl bg-white hover:bg-cream tactile-btn"
                title="Open your Profile & Avatar Menu"
              >
                {/* User Avatar Circle with Active Green Dot */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl ${activeColorObj.bgClass} border-2 border-charcoal flex items-center justify-center text-xl shadow-[2px_2px_0px_#1E1B18] transition-colors`}
                  >
                    <span>{userAvatar}</span>
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-mint border-2 border-charcoal"
                    title="Signed in & active"
                  />
                </div>

                {/* User Name & Role Label */}
                <div className="text-left">
                  <div className="font-display font-bold text-sm text-charcoal leading-tight truncate max-w-[110px]">
                    {userName}
                  </div>
                  <div className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
                    <span>● Signed In</span>
                  </div>
                </div>

                <i className="fa-solid fa-chevron-down text-xs text-charcoal/70 ml-1" />
              </button>

              {/* USER PROFILE DROPDOWN / POPOVER CARD */}
              {isProfileMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-3 w-80 bg-cream tactile-card-lg p-5 z-50 animate-pop-in space-y-4"
                >
                  {/* Top User Summary */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-charcoal/15">
                    <div
                      className={`w-14 h-14 rounded-2xl ${activeColorObj.bgClass} border-[2.5px] border-charcoal shadow-[3px_3px_0px_#1E1B18] flex items-center justify-center text-3xl shrink-0 transition-colors`}
                    >
                      <span>{userAvatar}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-extrabold uppercase text-charcoal/60">Signed in as</div>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full font-display font-bold text-base text-charcoal bg-white px-2.5 py-1 rounded-xl border-2 border-charcoal mt-0.5 focus:outline-none"
                      />
                      <div className="text-xs font-semibold text-charcoal/70 truncate mt-0.5">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Streak & Celebration Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-sunshine/50 border-2 border-charcoal text-center">
                      <div className="text-lg font-bold">🔥 4 Days</div>
                      <div className="text-[10px] font-extrabold uppercase text-charcoal/75">Note Streak</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCelebrationsOn(!celebrationsOn)}
                      className="p-2.5 rounded-xl bg-mint/40 border-2 border-charcoal text-center hover:bg-mint/60 transition"
                    >
                      <div className="text-lg font-bold">{celebrationsOn ? '🎊 On' : '🔕 Off'}</div>
                      <div className="text-[10px] font-extrabold uppercase text-charcoal/75">Celebrations</div>
                    </button>
                  </div>

                  {/* Switch Avatar Live */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-extrabold uppercase text-charcoal/70">Switch Profile Icon:</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAvatarChange(emoji)}
                          className={`h-9 rounded-xl border-2 border-charcoal text-lg flex items-center justify-center transition ${
                            userAvatar === emoji
                              ? 'bg-sunshine shadow-[2px_2px_0px_#1E1B18] scale-105'
                              : 'bg-white hover:bg-sunshine/30'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Switch Badge Color Live */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-extrabold uppercase text-charcoal/70">Switch Badge Color:</div>
                    <div className="flex items-center gap-2">
                      {BADGE_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleColorChange(c.id)}
                          className={`w-7 h-7 rounded-full ${c.bgClass} border-2 border-charcoal transition ${
                            userColorId === c.id ? 'ring-2 ring-charcoal scale-110' : 'opacity-75 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2 border-t-2 border-charcoal/15 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl bg-coral hover:bg-[#ff5252] text-white font-display font-bold text-xs sm:text-sm tactile-btn flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-right-from-bracket" />
                      <span>👋 Sign Out (Back to Login)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
           2. MAIN SPLIT-SCREEN WORKSPACE (LEFT: AI ASSISTANT | RIGHT: STICKY NOTES BOARD)
      ========================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* =================================================
               LEFT PANEL (5 Cols): YOUR AI NOTE BUDDY (VOICE & CHAT)
          ================================================== */}
          <section className="lg:col-span-5 bg-white tactile-card-lg p-5 sm:p-6 flex flex-col justify-between lg:sticky lg:top-[88px]">
            {/* Assistant Top Header */}
            <div className="flex items-center justify-between pb-4 border-b-[2.5px] border-charcoal">
              <div className="flex items-center gap-3">
                {/* Animated AI Buddy Character */}
                <div className="w-12 h-12 p-1.5 rounded-2xl bg-sky border-[2.5px] border-charcoal shadow-[3px_3px_0px_#1E1B18] flex items-center justify-center relative">
                  <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="12" width="32" height="26" rx="9" fill="#FFFDF8" stroke="#1E1B18" stroke-width="3" />
                    <line x1="24" y1="4" x2="24" y2="12" stroke="#1E1B18" stroke-width="3" />
                    <circle cx="24" cy="4" r="3.5" fill="#FF6B6B" stroke="#1E1B18" stroke-width="2.5" />
                    <circle cx="18" cy="23" r="2.8" fill="#1E1B18" />
                    <circle cx="30" cy="23" r="2.8" fill="#1E1B18" />
                    <circle cx="14" cy="26" r="2.5" fill="#FF6B6B" />
                    <circle cx="34" cy="26" r="2.5" fill="#FF6B6B" />
                    <path d="M19 29C20.5 31.5 27.5 31.5 29 29" stroke="#1E1B18" stroke-width="2.6" stroke-linecap="round" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-mint border-2 border-charcoal" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-lg sm:text-xl text-charcoal">Chirp AI Buddy</h2>
                    <span className="px-2 py-0.5 rounded-full bg-sunshine border border-charcoal text-[10px] font-extrabold">
                      Smart Helper
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>✨ Listening &amp; ready to manage your notes!</span>
                  </p>
                </div>
              </div>

              {/* Clear Chat Button */}
              <button
                onClick={resetAiConversation}
                className="px-2.5 py-1.5 rounded-xl bg-cream hover:bg-sunshine border-2 border-charcoal text-xs font-extrabold"
                title="Reset conversation"
              >
                🧹 Clear
              </button>
            </div>

            {/* Conversation Feed */}
            <div
              ref={chatFeedRef}
              className="my-4 h-[310px] sm:h-[340px] overflow-y-auto pr-1.5 space-y-3.5 bg-cream rounded-2xl p-3.5 border-2 border-charcoal"
            >
              {chatMessages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="flex items-start justify-end gap-2.5 animate-pop-in">
                    <div className="max-w-[82%] bg-sunshine px-4 py-2.5 rounded-2xl rounded-tr-none border-2 border-charcoal shadow-[2px_2px_0px_#1E1B18] text-xs sm:text-sm font-bold text-charcoal">
                      {msg.content}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl ${activeColorObj.bgClass} border-2 border-charcoal flex items-center justify-center text-sm shrink-0`}
                    >
                      {userAvatar}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-2.5 animate-pop-in">
                    <div className="w-8 h-8 rounded-xl bg-sky border-2 border-charcoal flex items-center justify-center text-sm shrink-0">
                      🤖
                    </div>
                    <div className="max-w-[86%] bg-white px-4 py-3 rounded-2xl rounded-tl-none border-2 border-charcoal shadow-[2px_2px_0px_#1E1B18] space-y-2">
                      <p className="text-xs sm:text-sm font-semibold text-charcoal leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.action && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-mint/45 border border-charcoal text-[11px] font-extrabold text-charcoal">
                          <span>{msg.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {isAiLoading && (
                <div className="flex items-start gap-2.5 animate-pop-in">
                  <div className="w-8 h-8 rounded-xl bg-sky border-2 border-charcoal flex items-center justify-center text-sm shrink-0">
                    🤖
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border-2 border-charcoal shadow-[2px_2px_0px_#1E1B18] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
                    <span className="text-xs font-bold text-charcoal/80">Thinking &amp; managing your desk...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hands-Free Voice Microphone Banner + Rainbow Soundwave */}
            <div
              className={`mb-4 p-3.5 rounded-2xl border-2 border-charcoal flex items-center justify-between gap-3 transition-all ${
                isVoiceListening ? 'bg-coral/25 listening-active ring-2 ring-coral' : 'bg-sunshine/45'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`w-12 h-12 rounded-2xl text-white tactile-btn flex items-center justify-center text-xl shrink-0 transition-transform ${
                    isVoiceListening ? 'bg-charcoal animate-pulse text-coral' : 'bg-coral hover:bg-[#ff5252]'
                  }`}
                  title={isVoiceListening ? 'Tap to finish & send voice note' : 'Speak to your AI Buddy'}
                >
                  <i className={`fa-solid ${isVoiceListening ? 'fa-stop' : 'fa-microphone'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm text-charcoal flex items-center gap-2">
                    <span>{isVoiceListening ? 'Listening to full sentence... 🎙️' : 'Tap the Mic & Speak Hands-Free 🎤'}</span>
                    {isVoiceListening && (
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-coral text-white animate-pulse">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-charcoal/80 truncate">
                    {isVoiceListening
                      ? chatInput
                        ? `"${chatInput}" — pauses auto-send full sentence`
                        : 'Speak naturally... say a full sentence and we\'ll send it when you pause!'
                      : 'Try saying: "Note to call Mom on Sunday"'}
                  </div>
                </div>
              </div>

              {/* Animated Rainbow Soundwave Bars */}
              <div className="flex items-center gap-1 h-7 px-2.5 py-1 rounded-xl bg-white border-2 border-charcoal shrink-0">
                <div className="wave-bar h-2 bg-coral" />
                <div className="wave-bar h-3.5 bg-sunshine" />
                <div className="wave-bar h-2.5 bg-mint" />
                <div className="wave-bar h-4 bg-sky" />
                <div className="wave-bar h-2.5 bg-lavender" />
                <div className="wave-bar h-3.5 bg-coral" />
                <div className="wave-bar h-2 bg-mint" />
              </div>
            </div>

            {/* One-Tap Voice/Chat Chips */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal/70">
                  ⚡ Tap a quick voice command to try:
                </span>
                <span className="font-hand text-base font-bold text-coral">Updates notes live! ➔</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => sendPromptToAi('Note to buy mangoes and oat milk #errands')}
                  className="px-2.5 py-1.5 rounded-xl bg-sunshine/70 hover:bg-sunshine border-2 border-charcoal text-xs font-bold text-charcoal transition"
                >
                  ➕ "Note to buy mangoes &amp; oat milk"
                </button>
                <button
                  type="button"
                  onClick={() => sendPromptToAi('Finish the dentist appointment note')}
                  className="px-2.5 py-1.5 rounded-xl bg-mint/50 hover:bg-mint border-2 border-charcoal text-xs font-bold text-charcoal transition"
                >
                  ✅ "Finish the dentist appointment note"
                </button>
                <button
                  type="button"
                  onClick={() => sendPromptToAi('Add bring phone charger to weekend packing list')}
                  className="px-2.5 py-1.5 rounded-xl bg-sky/50 hover:bg-sky border-2 border-charcoal text-xs font-bold text-charcoal transition"
                >
                  ✏️ "Add 'bring charger' to packing list"
                </button>
                <button
                  type="button"
                  onClick={() => sendPromptToAi('Show me all my pending to-do notes')}
                  className="px-2.5 py-1.5 rounded-xl bg-lavender/45 hover:bg-lavender border-2 border-charcoal text-xs font-bold text-charcoal transition"
                >
                  🔍 "Show my pending errands"
                </button>
              </div>
            </div>

            {/* Natural Language Chat Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPromptToAi(chatInput);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    isVoiceListening
                      ? 'Listening to your full sentence... (speak naturally)'
                      : 'Tell Chirp Buddy to add, finish, update, or find a note...'
                  }
                  disabled={isAiLoading}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-cream tactile-input font-semibold text-xs sm:text-sm text-charcoal"
                />
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  disabled={isAiLoading}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    isVoiceListening
                      ? 'bg-coral text-white animate-pulse'
                      : 'text-charcoal/60 hover:text-coral hover:bg-sunshine/50'
                  }`}
                  title={isVoiceListening ? 'Stop listening & send' : 'Speak with microphone'}
                >
                  <i className={`fa-solid ${isVoiceListening ? 'fa-stop' : 'fa-microphone'}`} />
                </button>
              </div>
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="px-4 py-3 rounded-2xl bg-mint hover:bg-[#3dbdb4] text-charcoal font-display font-bold text-xs sm:text-sm tactile-btn shrink-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Send</span>
                <i className="fa-solid fa-paper-plane" />
              </button>
            </form>
          </section>

          {/* =================================================
               RIGHT PANEL (7 Cols): YOUR COLORFUL STICKY NOTES BOARD
          ================================================== */}
          <section className="lg:col-span-7 space-y-6">
            {/* Personalized Greeting Banner */}
            <div className="bg-sunshine tactile-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl ${activeColorObj.bgClass} border-[2.5px] border-charcoal shadow-[3px_3px_0px_#1E1B18] flex items-center justify-center text-3xl shrink-0 transition-colors`}
                >
                  <span>{userAvatar}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-xl sm:text-2xl text-charcoal">
                      <span>{userName}</span>'s Sticky Board
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-charcoal/80">
                    Tap any checkbox to celebrate a finished task, or ask your AI Buddy on the left!
                  </p>
                </div>
              </div>

              <button
                onClick={openCreateModal}
                className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white hover:bg-cream text-charcoal font-display font-bold text-xs sm:text-sm tactile-btn shrink-0 flex items-center gap-2"
              >
                <i className="fa-solid fa-plus text-coral" />
                <span>+ New Sticky Note</span>
              </button>
            </div>

            {/* SMART SEARCH & FILTER CONTROL BAR */}
            <div className="bg-white tactile-card p-4 sm:p-5 space-y-4">
              {/* Row 1: Instant Search + Status Filter Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/50 text-sm" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Find any note by word or idea..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-cream border-2 border-charcoal font-semibold text-xs sm:text-sm text-charcoal focus:outline-none focus:bg-sunshine/15"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center"
                      title="Clear search"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-cream p-1.5 rounded-xl border-2 border-charcoal shrink-0">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs transition ${
                      filter === 'all'
                        ? 'bg-sunshine text-charcoal border border-charcoal'
                        : 'text-charcoal/70 hover:text-charcoal'
                    }`}
                  >
                    All ({totalNotesCount})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs transition ${
                      filter === 'pending'
                        ? 'bg-sunshine text-charcoal border border-charcoal'
                        : 'text-charcoal/70 hover:text-charcoal'
                    }`}
                  >
                    ⏳ To Do ({pendingNotesCount})
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs transition ${
                      filter === 'completed'
                        ? 'bg-sunshine text-charcoal border border-charcoal'
                        : 'text-charcoal/70 hover:text-charcoal'
                    }`}
                  >
                    🎉 Done ({doneNotesCount})
                  </button>
                </div>
              </div>

              {/* Row 2: Colorful Tag Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-charcoal/15">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-charcoal/70 mr-1">🏷️ Filter by Tag:</span>
                  <button
                    onClick={() => setTagFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 border-charcoal transition ${
                      tagFilter === 'all'
                        ? 'bg-charcoal text-cream scale-105'
                        : 'bg-cream hover:bg-sunshine/60 text-charcoal'
                    }`}
                  >
                    #all
                  </button>
                  {allUniqueTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 border-charcoal transition ${
                        tagFilter === tag
                          ? 'bg-charcoal text-cream scale-105'
                          : 'bg-cream hover:bg-sunshine/60 text-charcoal'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setFilter('all');
                    setTagFilter('all');
                    setSearch('');
                  }}
                  className="text-xs font-extrabold text-coral hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* STICKY NOTES RESPONSIVE GRID */}
            {isNotesLoading ? (
              <div className="bg-white tactile-card p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sunshine border-2 border-charcoal mx-auto flex items-center justify-center text-2xl animate-spin">
                  ⏳
                </div>
                <p className="font-display font-bold text-base text-charcoal">Gathering your sticky notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              /* Empty State Box */
              <div className="bg-white tactile-card p-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-sunshine border-2 border-charcoal mx-auto flex items-center justify-center text-3xl">
                  🕵️
                </div>
                <h3 className="font-display font-bold text-xl text-charcoal">No sticky notes match that filter!</h3>
                <p className="text-xs sm:text-sm font-semibold text-charcoal/70 max-w-md mx-auto">
                  Try clearing your search or ask your AI Buddy on the left to create a brand-new note for you.
                </p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setTagFilter('all');
                    setSearch('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-mint text-charcoal font-display font-bold text-xs sm:text-sm tactile-btn"
                >
                  Show All Notes ✨
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredNotes.map((note) => {
                  const colorKey = noteColors[note.id] || 'sunshine';
                  const palette = NOTE_COLOR_MAP[colorKey] || NOTE_COLOR_MAP.sunshine;
                  const primaryTag = note.tags && note.tags.length > 0 ? note.tags[0] : 'errands';

                  return (
                    <article
                      key={note.id}
                      className={`${palette.bg} tactile-card sticky-note-hover p-5 flex flex-col justify-between relative animate-pop-in ${
                        note.isCompleted ? 'opacity-85' : ''
                      }`}
                    >
                      {/* Top Row: Tag Pill + Action Icons */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-3 py-0.5 rounded-full bg-white border-2 border-charcoal text-xs font-extrabold text-charcoal">
                            #{primaryTag}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Cycle Sticky Note Color */}
                            <button
                              onClick={() => handleCycleColor(note.id)}
                              className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white border-2 border-charcoal flex items-center justify-center text-xs"
                              title="Change note color"
                            >
                              🎨
                            </button>
                            {/* Edit Sticky Note */}
                            <button
                              onClick={() => openEditModal(note)}
                              className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white border-2 border-charcoal flex items-center justify-center text-xs"
                              title="Edit note"
                            >
                              ✏️
                            </button>
                            {/* Delete Sticky Note */}
                            <button
                              onClick={() => handleDeleteNote(note.id, note.title)}
                              className="w-7 h-7 rounded-lg bg-white/90 hover:bg-coral hover:text-white border-2 border-charcoal flex items-center justify-center text-xs transition"
                              title="Delete note"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Note Title & Body */}
                        <h3
                          className={`font-display font-bold text-lg sm:text-xl text-charcoal mb-1.5 ${
                            note.isCompleted ? 'line-through decoration-2' : ''
                          }`}
                        >
                          {note.title}
                        </h3>
                        <p
                          className={`text-xs sm:text-sm font-semibold text-charcoal/90 whitespace-pre-line leading-relaxed mb-4 ${
                            note.isCompleted ? 'line-through opacity-75' : ''
                          }`}
                        >
                          {note.content}
                        </p>
                      </div>

                      {/* Bottom Row: Handwritten Timestamp + Interactive Complete Checkbox */}
                      <div className="pt-3 border-t-2 border-charcoal/20 flex items-center justify-between gap-2">
                        <span className="font-hand text-lg font-bold text-charcoal/85">
                          🕒 {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                        </span>

                        <button
                          onClick={() => handleToggleComplete(note.id, note.isCompleted)}
                          className={`px-3 py-1.5 rounded-xl border-2 border-charcoal font-display font-bold text-xs flex items-center gap-1.5 transition shadow-[2px_2px_0px_#1E1B18] ${
                            note.isCompleted
                              ? 'bg-mint text-charcoal'
                              : 'bg-white hover:bg-sunshine text-charcoal'
                          }`}
                        >
                          <span>{note.isCompleted ? '🎉 Completed!' : '⬜ Mark Done'}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =========================================================
           CREATE / EDIT STICKY NOTE MODAL
      ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/45 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cream tactile-card-lg max-w-md w-full p-6 sm:p-7 relative animate-pop-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 w-9 h-9 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal hover:bg-coral hover:text-white transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-sunshine border-2 border-charcoal shadow-[3px_3px_0px_#1E1B18] flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-charcoal">
                  {modalNoteId ? 'Edit Sticky Note ✏️' : 'Write a Sticky Note 📝'}
                </h3>
                <p className="text-xs font-bold text-charcoal/70">Pick a cheerful color &amp; tag for your board</p>
              </div>
            </div>

            <form onSubmit={handleSaveModalNote} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-charcoal mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Sunday Farmers Market List"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white tactile-input font-display font-bold text-base text-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-charcoal mb-1">Details / Thoughts</label>
                <textarea
                  rows={3}
                  required
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="Jot down your items or thoughts..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white tactile-input font-semibold text-sm text-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-charcoal mb-1">Tag Category</label>
                  <select
                    value={modalTag}
                    onChange={(e) => setModalTag(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white tactile-input font-bold text-xs sm:text-sm text-charcoal"
                  >
                    <option value="errands">#errands 🛒</option>
                    <option value="ideas">#ideas 💡</option>
                    <option value="work">#work 💻</option>
                    <option value="fun">#fun 🎉</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-charcoal mb-1">Sticky Color</label>
                  <select
                    value={modalColor}
                    onChange={(e) => setModalColor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white tactile-input font-bold text-xs sm:text-sm text-charcoal"
                  >
                    <option value="sunshine">☀️ Sunshine Yellow</option>
                    <option value="mint">🌿 Mint Green</option>
                    <option value="coral">🌸 Coral Pink</option>
                    <option value="sky">☁️ Sky Blue</option>
                    <option value="lavender">🔮 Soft Lavender</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isModalSaving}
                className="w-full py-3.5 rounded-2xl bg-coral hover:bg-[#ff5252] text-white font-display font-bold text-base tactile-btn disabled:opacity-60"
              >
                {isModalSaving ? 'Saving note...' : modalNoteId ? 'Save Changes ✨' : 'Pin Note to Board 📌'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
