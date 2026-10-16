import React, { useState, useRef } from 'react';
import { signup, login } from '../services/authService';
import type { User } from '../types';

interface LandingPageProps {
  onAuthSuccess: (user: User) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface LiveNote {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: 'note-yellow' | 'note-mint' | 'note-coral' | 'note-sky' | 'note-lavender';
  completed: boolean;
  timestamp: string;
  isCelebrating?: boolean;
}

const DEFAULT_BOARD_NOTES: LiveNote[] = [
  {
    id: 'note-1',
    title: 'Buy fresh strawberries & oat milk',
    content: 'Get the ripe organic ones from the farmers market stall on 4th street 🍓',
    tag: 'groceries',
    color: 'note-yellow',
    completed: false,
    timestamp: 'Just added',
  },
  {
    id: 'note-2',
    title: 'Walk the dog in the sunny park',
    content: 'Bring the red tennis ball and fetch leash 🐾',
    tag: 'errands',
    color: 'note-mint',
    completed: true,
    timestamp: 'Finished today 🎉',
  },
  {
    id: 'note-3',
    title: "Maya's birthday gift: yellow ceramic mug",
    content: 'She saw that handmade lemon mug at the artisan pottery fair 🎁',
    tag: 'ideas',
    color: 'note-lavender',
    completed: false,
    timestamp: 'Saved yesterday',
  },
  {
    id: 'note-4',
    title: 'Call Grandma on Sunday morning',
    content: 'Tell her about the new apartment balcony plants and send pictures 💛',
    tag: 'family',
    color: 'note-coral',
    completed: false,
    timestamp: 'Due Sunday',
  },
  {
    id: 'note-5',
    title: 'Finish chapter 3 of sci-fi novel',
    content: 'Read for 30 minutes before bed with chamomile tea 📚',
    tag: 'reading',
    color: 'note-sky',
    completed: false,
    timestamp: 'Tonight',
  },
  {
    id: 'note-6',
    title: 'Plan weekend road trip playlist',
    content: 'Upbeat indie folk, acoustic guitars, and highway classics 🚗🎶',
    tag: 'fun',
    color: 'note-yellow',
    completed: true,
    timestamp: 'Finished 🎉',
  },
];

const COLOR_CYCLE: Array<'note-yellow' | 'note-mint' | 'note-coral' | 'note-sky' | 'note-lavender'> = [
  'note-yellow',
  'note-mint',
  'note-coral',
  'note-sky',
  'note-lavender',
];

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthSuccess, showToast }) => {
  // ================= Auth Modal State =================
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ================= Hero Section Interactive State =================
  const [heroStep, setHeroStep] = useState<number | null>(null);
  const [heroHelperReply, setHeroHelperReply] = useState<string>(
    'Tap any voice bubble on the left and watch me organize your sticky notes!'
  );
  const [heroStatusText, setHeroStatusText] = useState('Ready to help!');
  const [heroNotes, setHeroNotes] = useState([
    {
      id: 'h-1',
      title: 'Buy strawberries and oat milk',
      tag: 'groceries',
      color: 'note-yellow',
      completed: false,
      visible: true,
      celebrating: false,
    },
    {
      id: 'h-2',
      title: 'Walk the dog in the park',
      tag: 'errands',
      color: 'note-mint',
      completed: false,
      visible: true,
      celebrating: false,
    },
  ]);
  const [isHeroMicActive, setIsHeroMicActive] = useState(false);

  // ================= Live Board Interactive State =================
  const [boardNotes, setBoardNotes] = useState<LiveNote[]>(DEFAULT_BOARD_NOTES);
  const [boardSearch, setBoardSearch] = useState('');
  const [boardStatusFilter, setBoardStatusFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [boardTagFilter, setBoardTagFilter] = useState<string>('all');
  const [boardInputText, setBoardInputText] = useState('');
  const [boardAssistantMsg, setBoardAssistantMsg] = useState(
    'Hi there! Tell me what to jot down, check off, or find for you 💛'
  );
  const [isBoardListening, setIsBoardListening] = useState(false);

  // ================= Features Section Interactive State =================
  const [featureCardColor, setFeatureCardColor] = useState<string>('note-lavender');
  const [isMiniWaveActive, setIsMiniWaveActive] = useState(false);

  const speechRecognitionRef = useRef<any>(null);

  // Open Auth Modal helper
  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => {
    setIsAuthModalOpen(false);
    setAuthError('');
  };

  // Handle Auth submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (authMode === 'signin') {
        if (!email || !password) {
          setAuthError('Please fill in both email and passcode.');
          setIsAuthLoading(false);
          return;
        }
        const res = await login(email, password);
        if (res.data.success) {
          showToast('Welcome back! 🌻', 'success');
          onAuthSuccess(res.data.user);
        } else {
          setAuthError(res.data.message || 'Login failed. Please check your credentials.');
        }
      } else {
        if (!name || !email || !password) {
          setAuthError('Please fill in your name, email, and passcode.');
          setIsAuthLoading(false);
          return;
        }
        const res = await signup(name, email, password);
        if (res.data.success) {
          showToast('Welcome to ChirpNotes! 🎉', 'success');
          onAuthSuccess(res.data.user);
        } else {
          setAuthError(res.data.message || 'Could not create account. Please try again.');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please check connection.';
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ================= Hero Voice Bubble Interactions =================
  const triggerHeroSample = (index: number) => {
    setHeroStep(index);
    setIsHeroMicActive(true);

    if (index === 0) {
      setHeroStatusText('Listening...');
      setHeroHelperReply('Jotting down your grocery reminder with a sunny card! 🍓');

      setTimeout(() => {
        setIsHeroMicActive(false);
        setHeroStatusText('Note created! ✨');
        setHeroNotes((prev) => {
          const exists = prev.find((n) => n.id === 'h-1');
          if (exists) {
            return prev.map((n) => (n.id === 'h-1' ? { ...n, celebrating: true, completed: false } : n));
          }
          return [
            {
              id: 'h-1',
              title: 'Buy strawberries and oat milk',
              tag: 'groceries',
              color: 'note-yellow',
              completed: false,
              visible: true,
              celebrating: true,
            },
            ...prev,
          ];
        });
      }, 700);
    } else if (index === 1) {
      setHeroStatusText('Listening...');
      setHeroHelperReply('Woohoo! Checking off "Walk the dog" from your list 🎉');

      setTimeout(() => {
        setIsHeroMicActive(false);
        setHeroStatusText('Task checked off! ✅');
        setHeroNotes((prev) =>
          prev.map((n) => (n.id === 'h-2' ? { ...n, completed: true, celebrating: true } : n))
        );
      }, 700);
    } else if (index === 2) {
      setHeroStatusText('Listening...');
      setHeroHelperReply('Added yellow ceramic mug to Maya\'s gift list! 🎁');

      setTimeout(() => {
        setIsHeroMicActive(false);
        setHeroStatusText('Gift idea pinned! 📌');
        setHeroNotes((prev) => {
          const exists = prev.find((n) => n.id === 'h-3');
          if (exists) return prev;
          return [
            ...prev,
            {
              id: 'h-3',
              title: 'Maya gift: yellow ceramic mug',
              tag: 'gift idea',
              color: 'note-lavender',
              completed: false,
              visible: true,
              celebrating: true,
            },
          ];
        });
      }, 700);
    }
  };

  // ================= Live Board Helper Logic =================
  const handleBoardCommand = (text: string) => {
    const raw = text.trim();
    if (!raw) return;

    const lower = raw.toLowerCase();

    // 1. Check off / Complete intent
    if (lower.includes('done') || lower.includes('check off') || lower.includes('complete') || lower.includes('finish')) {
      let matched = false;
      setBoardNotes((prev) =>
        prev.map((n) => {
          const titleMatch =
            lower.includes('dog') && n.title.toLowerCase().includes('dog') ||
            lower.includes('grocer') && n.title.toLowerCase().includes('strawberr') ||
            lower.includes('book') && n.title.toLowerCase().includes('novel') ||
            lower.includes('road trip') && n.title.toLowerCase().includes('playlist') ||
            lower.includes('grandma') && n.title.toLowerCase().includes('grandma');

          if (titleMatch || lower.includes(n.title.toLowerCase().slice(0, 8))) {
            matched = true;
            return { ...n, completed: true, timestamp: 'Finished just now 🎉', isCelebrating: true };
          }
          return n;
        })
      );

      if (matched) {
        setBoardAssistantMsg(`Woohoo! Marked that task as finished 🎉 You're on a roll!`);
        showToast('Task checked off!', 'success');
      } else {
        setBoardAssistantMsg(`I checked off your matching errand! Great job getting it done.`);
      }
      setBoardInputText('');
      return;
    }

    // 2. Search / Find intent
    if (lower.startsWith('find') || lower.startsWith('search')) {
      const keyword = lower.replace(/^(find|search)\s+(my\s+)?/i, '').replace(/notes?|ideas?/gi, '').trim();
      setBoardSearch(keyword);
      setBoardAssistantMsg(`Found everything matching "${keyword}" on your sunny desk! 🔍`);
      setBoardInputText('');
      return;
    }

    // 3. Add / Create intent
    let cleanTitle = raw.replace(/^(add|create|remind me to|make a note to|jot down)\s+/i, '');
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    let tag = 'errands';
    let color: LiveNote['color'] = 'note-yellow';

    if (lower.includes('pack') || lower.includes('weekend') || lower.includes('trip')) {
      tag = 'travel';
      color = 'note-sky';
    } else if (lower.includes('grandma') || lower.includes('family') || lower.includes('mom') || lower.includes('dad')) {
      tag = 'family';
      color = 'note-coral';
    } else if (lower.includes('book') || lower.includes('read') || lower.includes('study')) {
      tag = 'reading';
      color = 'note-lavender';
    } else if (lower.includes('grocery') || lower.includes('food') || lower.includes('buy')) {
      tag = 'groceries';
      color = 'note-mint';
    }

    const newNote: LiveNote = {
      id: 'custom-' + Date.now(),
      title: cleanTitle,
      content: 'Added by your voice assistant — tap the checkbox anytime to check it off ✨',
      tag,
      color,
      completed: false,
      timestamp: 'Just now 📌',
      isCelebrating: true,
    };

    setBoardNotes((prev) => [newNote, ...prev]);
    setBoardAssistantMsg(`Pinned "${cleanTitle}" to your board with a fresh #${tag} card! 💛`);
    showToast(`Note pinned: ${cleanTitle}`, 'success');
    setBoardInputText('');
  };

  const toggleBoardVoice = () => {
    if (isBoardListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsBoardListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Simulate speech for browser compatibility
      setIsBoardListening(true);
      setBoardAssistantMsg('Listening to your voice... (say something!) 🎙️');
      setTimeout(() => {
        setIsBoardListening(false);
        handleBoardCommand('Add buy fresh strawberries and oat milk');
      }, 2200);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsBoardListening(true);
        setBoardAssistantMsg('Listening closely to your voice... 🎙️');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsBoardListening(false);
        handleBoardCommand(transcript);
      };

      recognition.onerror = () => {
        setIsBoardListening(false);
        setBoardAssistantMsg("Couldn't hear clearly, try typing your note above!");
      };

      recognition.onend = () => {
        setIsBoardListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsBoardListening(false);
    }
  };

  // Toggle single note complete
  const toggleNoteComplete = (id: string) => {
    setBoardNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const next = !n.completed;
          return {
            ...n,
            completed: next,
            timestamp: next ? 'Finished just now 🎉' : 'Marked To Do',
            isCelebrating: next,
          };
        }
        return n;
      })
    );
  };

  // Cycle color
  const cycleNoteColor = (id: string) => {
    setBoardNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const idx = COLOR_CYCLE.indexOf(n.color);
          const nextColor = COLOR_CYCLE[(idx + 1) % COLOR_CYCLE.length];
          return { ...n, color: nextColor };
        }
        return n;
      })
    );
  };

  // Delete note
  const deleteNote = (id: string) => {
    setBoardNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Note removed from your board', 'info');
  };

  // Reset board
  const resetBoard = () => {
    setBoardNotes(DEFAULT_BOARD_NOTES);
    setBoardSearch('');
    setBoardStatusFilter('all');
    setBoardTagFilter('all');
    setBoardAssistantMsg('Reset your sample board back to sunny defaults! 🌻');
  };

  // Tags list
  const availableTags = Array.from(new Set(boardNotes.map((n) => n.tag)));

  // Filtered notes
  const filteredNotes = boardNotes.filter((n) => {
    const matchesStatus =
      boardStatusFilter === 'all'
        ? true
        : boardStatusFilter === 'todo'
          ? !n.completed
          : n.completed;

    const matchesTag = boardTagFilter === 'all' || n.tag === boardTagFilter;

    const matchesSearch =
      !boardSearch.trim() ||
      n.title.toLowerCase().includes(boardSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(boardSearch.toLowerCase()) ||
      n.tag.toLowerCase().includes(boardSearch.toLowerCase());

    return matchesStatus && matchesTag && matchesSearch;
  });

  const countAll = boardNotes.length;
  const countTodo = boardNotes.filter((n) => !n.completed).length;
  const countDone = boardNotes.filter((n) => n.completed).length;

  return (
    <div className="min-h-screen bg-cream text-charcoal bg-stationery-dots antialiased selection:bg-sunshine selection:text-charcoal relative">
      {/* Playful Floating Background Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-sunshine/35 blur-3xl animate-float-slow" />
        <div className="absolute top-24 -right-24 w-80 h-80 rounded-full bg-mint/25 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-coral/20 blur-3xl animate-float-slow" />
        <div className="absolute bottom-12 right-10 w-96 h-96 rounded-full bg-lavender/20 blur-3xl animate-float-delayed" />
      </div>

      {/* ==========================================
           1. TOP NAVIGATION BAR
      =========================================== */}
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b-2 border-charcoal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-sunshine tactile-card flex items-center justify-center relative">
              <i className="fa-solid fa-dove text-charcoal text-xl group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-coral border-2 border-charcoal flex items-center justify-center text-[10px] text-white font-bold">
                ♪
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-2xl tracking-tight text-charcoal flex items-center gap-1.5">
                ChirpNotes
                <span className="text-xs font-sans font-bold uppercase px-2.5 py-0.5 rounded-full bg-mint/30 text-charcoal border border-charcoal/20">
                  Sunny &amp; Simple
                </span>
              </span>
              <p className="text-xs text-charcoal/65 font-medium hidden sm:block">
                Talk out loud, stay effortlessly organized
              </p>
            </div>
          </a>

          {/* Simple Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-charcoal/80">
            <a href="#how-it-works" className="hover:text-coral transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-coral transition-colors">
              Features
            </a>
            <a href="#live-board" className="hover:text-coral transition-colors flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-mint border border-charcoal animate-bounce" />
              <span>Try the Board</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth('signin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-sm text-charcoal hover:bg-sunshine/30 transition"
            >
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-5 py-2.5 rounded-full bg-coral text-white font-display font-bold text-sm sm:text-base tactile-card hover:bg-[#ff5252] flex items-center gap-2"
            >
              <span>Start Taking Notes — Free</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ==========================================
             2. HERO SECTION
        =========================================== */}
        <section className="pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Copy & Voice Bubbles */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Handwritten Doodle Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sunshine/60 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] -rotate-1">
                <span className="font-hand text-2xl font-bold text-charcoal">
                  ✨ Just talk, we'll write it down!
                </span>
              </div>

              {/* Big Warm Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-charcoal leading-[1.12]">
                Say your thoughts out loud. Watch them turn into{' '}
                <span className="relative inline-block px-2">
                  <span className="absolute inset-0 bg-sunshine rounded-2xl -rotate-1 border-2 border-charcoal shadow-[4px_4px_0px_#1E1E24] -z-10" />
                  <span>neat, colorful notes.</span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-charcoal/80 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                No typing, no messy folders. Just chat naturally to jot down ideas, check off errands, and find anything in seconds.
              </p>

              {/* Interactive Hero Voice Bar & Sample Bubbles */}
              <div className="sunny-glass rounded-3xl p-5 sm:p-6 border-2 border-charcoal shadow-[6px_6px_0px_#1E1E24] max-w-2xl mx-auto lg:mx-0 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => triggerHeroSample((heroStep === null ? 0 : heroStep + 1) % 3)}
                      className="w-14 h-14 rounded-2xl bg-coral text-white tactile-card flex items-center justify-center text-2xl shrink-0 group"
                      title="Tap to test a voice note!"
                    >
                      <i className="fa-solid fa-microphone group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-charcoal">
                          Tap a phrase below to try it!
                        </span>
                        {isHeroMicActive && (
                          <span className="px-2.5 py-0.5 rounded-full bg-mint/30 text-charcoal font-bold text-xs animate-pulse">
                            Listening...
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-charcoal/70">
                        Click any voice bubble and watch the sticky board on the right magic-update:
                      </p>
                    </div>
                  </div>

                  {/* Cheerful Soundwave Visualizer */}
                  <div className={`flex items-center gap-1.5 h-9 px-3 py-1 rounded-2xl bg-cream border-2 border-charcoal/15 ${isHeroMicActive ? 'active-wave' : ''}`}>
                    <div className="cheer-bar h-3 bg-coral" />
                    <div className="cheer-bar h-5 bg-tangerine" />
                    <div className="cheer-bar h-4 bg-sunshine" />
                    <div className="cheer-bar h-6 bg-mint" />
                    <div className="cheer-bar h-3 bg-sky" />
                    <div className="cheer-bar h-5 bg-lavender" />
                  </div>
                </div>

                {/* 3 Sample Voice Bubbles */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={() => triggerHeroSample(0)}
                    className="flex-1 min-w-[220px] text-left px-4 py-3 rounded-2xl bg-sunshine/40 hover:bg-sunshine border-2 border-charcoal font-bold text-xs sm:text-sm text-charcoal transition flex items-center gap-2.5 shadow-[3px_3px_0px_#1E1E24] active:translate-y-0.5"
                  >
                    <span className="text-lg">🗣️</span>
                    <span>"Remind me to buy strawberries and oat milk"</span>
                  </button>

                  <button
                    onClick={() => triggerHeroSample(1)}
                    className="flex-1 min-w-[200px] text-left px-4 py-3 rounded-2xl bg-mint/35 hover:bg-mint/70 border-2 border-charcoal font-bold text-xs sm:text-sm text-charcoal transition flex items-center gap-2.5 shadow-[3px_3px_0px_#1E1E24] active:translate-y-0.5"
                  >
                    <span className="text-lg">🗣️</span>
                    <span>"Check off walking the dog!"</span>
                  </button>

                  <button
                    onClick={() => triggerHeroSample(2)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-lavender/25 hover:bg-lavender/50 border-2 border-charcoal font-bold text-xs sm:text-sm text-charcoal transition flex items-center gap-2.5 shadow-[3px_3px_0px_#1E1E24] active:translate-y-0.5"
                  >
                    <span className="text-lg">🗣️</span>
                    <span>"Add a gift idea for Maya: yellow ceramic mug"</span>
                  </button>
                </div>
              </div>

              {/* Primary Hero CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#live-board"
                  className="px-7 py-4 rounded-full bg-sunshine text-charcoal font-display font-bold text-base sm:text-lg tactile-card flex items-center gap-3"
                >
                  <span>Play With the Live Note Board</span>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </a>
                <button
                  onClick={() => openAuth('signup')}
                  className="px-6 py-4 rounded-full bg-white text-charcoal font-display font-bold text-base tactile-card hover:bg-cream flex items-center gap-2"
                >
                  <i className="fa-regular fa-face-smile-beam text-coral" />
                  <span>Create Free Account</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Sticky Note Preview Board */}
            <div className="lg:col-span-5">
              <div className="sunny-glass rounded-[32px] p-5 sm:p-6 border-2 border-charcoal shadow-[10px_10px_0px_#1E1E24] relative">
                {/* Handwritten Floating Sticker */}
                <div className="hidden sm:flex absolute -top-5 -right-4 bg-coral text-white font-hand text-xl font-bold px-4 py-1 rounded-full border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] rotate-6 items-center gap-1">
                  <span>✨ Updates by voice!</span>
                </div>

                {/* Board Top Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-charcoal/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-coral border border-charcoal" />
                    <span className="w-3.5 h-3.5 rounded-full bg-sunshine border border-charcoal" />
                    <span className="w-3.5 h-3.5 rounded-full bg-mint border border-charcoal" />
                    <span className="ml-2 font-display font-bold text-sm text-charcoal">My Sunny Desk 🌻</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-sunshine/60 border border-charcoal text-charcoal">
                    {heroStatusText}
                  </span>
                </div>

                {/* Friendly Helper Speech Bubble */}
                <div className="mb-4 p-3.5 rounded-2xl bg-cream border-2 border-charcoal flex items-center gap-3 shadow-[3px_3px_0px_#1E1E24]">
                  <div className="w-9 h-9 rounded-xl bg-sunshine border-2 border-charcoal flex items-center justify-center text-lg shrink-0">
                    🐤
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-charcoal leading-snug">
                    "{heroHelperReply}"
                  </p>
                </div>

                {/* Hero Sticky Notes Stack */}
                <div className="space-y-3">
                  {heroNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-2xl tactile-card ${note.color} ${note.celebrating ? 'note-celebrate' : ''
                        } flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setHeroNotes((prev) =>
                              prev.map((n) =>
                                n.id === note.id ? { ...n, completed: !n.completed, celebrating: true } : n
                              )
                            );
                          }}
                          className={`w-6 h-6 rounded-lg border-2 border-charcoal flex items-center justify-center font-bold text-xs ${note.completed ? 'bg-charcoal text-white' : 'bg-white text-transparent'
                            }`}
                        >
                          ✓
                        </button>
                        <div>
                          <p
                            className={`font-display font-bold text-sm text-charcoal ${note.completed ? 'line-through opacity-60' : ''
                              }`}
                          >
                            {note.title}
                          </p>
                          <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 border border-charcoal/20 text-charcoal">
                            #{note.tag}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-hand font-bold text-charcoal/80">
                        {note.completed ? 'Done 🎉' : 'To Do ⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
             3. INTERACTIVE "PLAY WITH YOUR NOTES" LIVE BOARD
        =========================================== */}
        <section id="live-board" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-mint/40 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] font-hand text-2xl font-bold text-charcoal rotate-1">
              <span>🎨 Try It Right Here — No Sign-Up Needed!</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-charcoal">
              Play With Your Interactive Note Board
            </h2>
            <p className="text-charcoal/75 text-base sm:text-lg font-medium">
              Speak with your microphone, type a quick thought, or tap a colorful suggestion chip below. You can also check off errands, switch note colors, or filter by tag!
            </p>
          </div>

          {/* Main Interactive Board Container */}
          <div className="sunny-glass rounded-[36px] p-5 sm:p-8 border-2 border-charcoal shadow-[12px_12px_0px_#1E1E24] space-y-7">
            {/* TOP: Friendly Voice & Chat Assistant Bar */}
            <div className="bg-cream rounded-3xl p-4 sm:p-6 border-2 border-charcoal shadow-[6px_6px_0px_#1E1E24] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Helper Avatar + Friendly Reply */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sunshine border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-2xl shrink-0">
                    🐤
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-charcoal">Sunny Helper</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-mint/40 border border-charcoal text-charcoal">
                        Always Listening
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-charcoal mt-0.5">
                      "{boardAssistantMsg}"
                    </p>
                  </div>
                </div>

                {/* Voice Status Pill */}
                {isBoardListening && (
                  <div className="flex active-wave items-center gap-3 px-4 py-2 rounded-2xl bg-coral/15 border-2 border-coral">
                    <span className="w-3 h-3 rounded-full bg-coral animate-ping" />
                    <span className="text-xs sm:text-sm font-bold text-charcoal">Listening to your voice...</span>
                    <div className="flex items-center gap-1 h-7">
                      <div className="cheer-bar" />
                      <div className="cheer-bar" />
                      <div className="cheer-bar" />
                      <div className="cheer-bar" />
                      <div className="cheer-bar" />
                      <div className="cheer-bar" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBoardCommand(boardInputText);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={boardInputText}
                    onChange={(e) => setBoardInputText(e.target.value)}
                    placeholder="Tell your helper anything... e.g. 'Add buy sunflowers to errands' or 'Mark grocery shopping done'"
                    className="w-full pl-5 pr-12 py-4 rounded-2xl bg-white border-2 border-charcoal text-charcoal placeholder-charcoal/45 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-sunshine/60 shadow-inner"
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={toggleBoardVoice}
                    className={`px-5 py-4 rounded-2xl font-display font-bold text-sm sm:text-base tactile-card flex items-center gap-2 transition ${isBoardListening ? 'bg-sunshine text-charcoal' : 'bg-coral text-white hover:bg-[#ff5252]'
                      }`}
                    title="Speak out loud"
                  >
                    <i className="fa-solid fa-microphone text-lg" />
                    <span>{isBoardListening ? 'Listening...' : 'Tap & Speak'}</span>
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="px-6 py-4 rounded-2xl bg-sunshine text-charcoal font-display font-bold text-sm sm:text-base tactile-card hover:bg-[#ffc642] flex items-center gap-2"
                  >
                    <span>Do It!</span>
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </div>
              </form>

              {/* One-Tap Suggestions */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 mr-1">
                  <i className="fa-solid fa-wand-sparkles text-tangerine mr-1" />
                  One-Tap Ideas:
                </span>
                <button
                  type="button"
                  onClick={() => handleBoardCommand('Create a weekend packing note')}
                  className="px-3.5 py-1.5 rounded-full bg-sunshine/50 hover:bg-sunshine border-2 border-charcoal text-xs font-bold text-charcoal transition shadow-[2px_2px_0px_#1E1E24]"
                >
                  🎒 "Create a weekend packing note"
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardCommand('Mark grocery shopping as done')}
                  className="px-3.5 py-1.5 rounded-full bg-mint/45 hover:bg-mint border-2 border-charcoal text-xs font-bold text-charcoal transition shadow-[2px_2px_0px_#1E1E24]"
                >
                  ✅ "Mark grocery shopping as done"
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardCommand('Find reading')}
                  className="px-3.5 py-1.5 rounded-full bg-sky/30 hover:bg-sky/60 border-2 border-charcoal text-xs font-bold text-charcoal transition shadow-[2px_2px_0px_#1E1E24]"
                >
                  📚 "Find reading"
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardCommand('Add call Grandma on Sunday morning')}
                  className="px-3.5 py-1.5 rounded-full bg-coral/35 hover:bg-coral/70 border-2 border-charcoal text-xs font-bold text-charcoal transition shadow-[2px_2px_0px_#1E1E24]"
                >
                  💛 "Add call Grandma tomorrow"
                </button>
              </div>
            </div>

            {/* MIDDLE: Search, Status Tabs & Tag Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50" />
                <input
                  type="text"
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  placeholder="Search your notes..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-charcoal text-sm font-bold text-charcoal placeholder-charcoal/45 shadow-[3px_3px_0px_#1E1E24] focus:outline-none focus:bg-sunshine/10"
                />
                {boardSearch && (
                  <button
                    onClick={() => setBoardSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal"
                  >
                    <i className="fa-solid fa-circle-xmark" />
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1.5 rounded-2xl bg-cream border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24]">
                  <button
                    onClick={() => setBoardStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition ${boardStatusFilter === 'all'
                        ? 'bg-sunshine text-charcoal border-charcoal'
                        : 'border-transparent text-charcoal/70 hover:text-charcoal'
                      }`}
                  >
                    All Notes <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/80 text-xs">{countAll}</span>
                  </button>
                  <button
                    onClick={() => setBoardStatusFilter('todo')}
                    className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition ${boardStatusFilter === 'todo'
                        ? 'bg-sunshine text-charcoal border-charcoal'
                        : 'border-transparent text-charcoal/70 hover:text-charcoal'
                      }`}
                  >
                    To Do <span className="ml-1 px-1.5 py-0.5 rounded-full bg-charcoal/10 text-xs">{countTodo}</span>
                  </button>
                  <button
                    onClick={() => setBoardStatusFilter('done')}
                    className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition ${boardStatusFilter === 'done'
                        ? 'bg-sunshine text-charcoal border-charcoal'
                        : 'border-transparent text-charcoal/70 hover:text-charcoal'
                      }`}
                  >
                    Finished 🎉 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-charcoal/10 text-xs">{countDone}</span>
                  </button>
                </div>

                <button
                  onClick={resetBoard}
                  className="px-3.5 py-3 rounded-2xl bg-white hover:bg-sunshine/30 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] text-xs font-bold text-charcoal"
                  title="Reset sample notes"
                >
                  <i className="fa-solid fa-rotate-left mr-1" />
                  Reset
                </button>
              </div>
            </div>

            {/* Tag Filter Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-charcoal/70 shrink-0 mr-1">Filter by Tag:</span>
              <button
                onClick={() => setBoardTagFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-charcoal transition ${boardTagFilter === 'all'
                    ? 'bg-charcoal text-cream scale-105'
                    : 'bg-cream hover:bg-sunshine/60 text-charcoal'
                  }`}
              >
                #all
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setBoardTagFilter(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-charcoal transition ${boardTagFilter === tag
                      ? 'bg-charcoal text-cream scale-105'
                      : 'bg-white hover:bg-sunshine/50 text-charcoal'
                    }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* BOTTOM: Interactive Sticky Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-3xl p-6 tactile-card ${note.color} ${note.isCelebrating ? 'note-celebrate' : ''
                    } flex flex-col justify-between space-y-4`}
                >
                  {/* Top Bar of Note */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-charcoal/20 font-bold text-xs text-charcoal">
                      #{note.tag}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Color Switcher */}
                      <button
                        onClick={() => cycleNoteColor(note.id)}
                        className="w-7 h-7 rounded-full bg-white/80 hover:bg-white border border-charcoal flex items-center justify-center text-xs text-charcoal transition"
                        title="Change card color"
                      >
                        🎨
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="w-7 h-7 rounded-full bg-white/80 hover:bg-coral hover:text-white border border-charcoal flex items-center justify-center text-xs transition"
                        title="Delete note"
                      >
                        <i className="fa-solid fa-trash text-[11px]" />
                      </button>
                    </div>
                  </div>

                  {/* Note Body */}
                  <div className="space-y-1.5">
                    <h3
                      className={`font-display font-bold text-lg text-charcoal leading-snug ${note.completed ? 'line-through opacity-60' : ''
                        }`}
                    >
                      {note.title}
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium text-charcoal/80 leading-relaxed ${note.completed ? 'line-through opacity-50' : ''
                      }`}>
                      {note.content}
                    </p>
                  </div>

                  {/* Note Footer: Checkbox + Timestamp */}
                  <div className="pt-2 border-t border-charcoal/15 flex items-center justify-between">
                    <button
                      onClick={() => toggleNoteComplete(note.id)}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border-2 border-charcoal flex items-center justify-center font-bold text-xs transition ${note.completed ? 'bg-charcoal text-white' : 'bg-white text-transparent group-hover:border-coral'
                          }`}
                      >
                        ✓
                      </div>
                      <span className="font-display font-bold text-xs text-charcoal">
                        {note.completed ? 'Finished 🎉' : 'Mark Done'}
                      </span>
                    </button>
                    <span className="font-hand font-bold text-sm text-charcoal/70">
                      {note.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
             4. COLORFUL FEATURE CARDS (ZERO JARGON)
        =========================================== */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-coral/20 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] font-hand text-2xl font-bold text-charcoal -rotate-1">
              <span>🌈 Made for Real Life, Not Robots</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-charcoal">
              Everything You Need to Feel Clear &amp; Organized
            </h2>
            <p className="text-charcoal/75 text-base sm:text-lg font-medium">
              Whether you're making pancakes, walking the dog, or brainstorming your next big project, ChirpNotes keeps up with you effortlessly.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-7">
            {/* 1. Hands-Free Voice Capture */}
            <div className="md:col-span-3 rounded-[32px] p-7 sm:p-8 note-yellow tactile-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-14 h-14 rounded-2xl bg-white border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-3xl">
                    🗣️
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white/80 border-2 border-charcoal font-bold text-xs">
                    Hands-Free Magic
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-charcoal">
                  Hands-Free Voice Capture
                </h3>
                <p className="text-charcoal/85 text-base font-medium leading-relaxed">
                  Cooking dinner or walking outside? Just speak naturally and your words turn into tidy notes right away—no keyboard needed.
                </p>
              </div>

              {/* Mini Soundwave Toy */}
              <div
                onClick={() => setIsMiniWaveActive(!isMiniWaveActive)}
                className="cursor-pointer p-4 rounded-2xl bg-white/85 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-between group select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-coral text-white border-2 border-charcoal flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-volume-high text-sm" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-charcoal">
                    {isMiniWaveActive ? 'Voice wave dancing! 🎶' : 'Tap here to test the happy voice wave!'}
                  </span>
                </div>
                <div className={`flex items-center gap-1 h-7 ${isMiniWaveActive ? 'active-wave' : ''}`}>
                  <div className="cheer-bar h-3 bg-coral" />
                  <div className="cheer-bar h-6 bg-tangerine" />
                  <div className="cheer-bar h-4 bg-mint" />
                  <div className="cheer-bar h-5 bg-sky" />
                  <div className="cheer-bar h-3 bg-lavender" />
                </div>
              </div>
            </div>

            {/* 2. A Helper That Organizes For You */}
            <div className="md:col-span-3 rounded-[32px] p-7 sm:p-8 note-mint tactile-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-14 h-14 rounded-2xl bg-white border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-3xl">
                    🪄
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white/80 border-2 border-charcoal font-bold text-xs">
                    Smart Helper
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-charcoal">
                  A Helper That Organizes For You
                </h3>
                <p className="text-charcoal/85 text-base font-medium leading-relaxed">
                  Don't waste time sorting through menus. Just say <em>"Mark my dentist appointment done"</em> or <em>"Add pasta to groceries"</em> and your helper updates the right note automatically.
                </p>
              </div>

              {/* Before/After Pill */}
              <div className="p-4 rounded-2xl bg-white/85 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold">
                <span className="text-charcoal/70">"Add apples to groceries"</span>
                <i className="fa-solid fa-arrow-right text-charcoal" />
                <span className="px-3 py-1 rounded-full bg-mint/40 border border-charcoal text-charcoal">
                  🍎 Added to #groceries!
                </span>
              </div>
            </div>

            {/* 3. Feel-Good Colorful Workspace */}
            <div className={`md:col-span-2 rounded-[32px] p-7 ${featureCardColor} tactile-card flex flex-col justify-between space-y-5 transition-colors`}>
              <div className="space-y-3">
                <span className="w-12 h-12 rounded-2xl bg-white border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-2xl">
                  🎨
                </span>
                <h3 className="font-display text-2xl font-bold text-charcoal">
                  Feel-Good Colorful Workspace
                </h3>
                <p className="text-charcoal/85 text-sm sm:text-base font-medium leading-relaxed">
                  Designed like your favorite sunny desk—smooth animations, frosted colorful cards, and color-coded tags that make staying organized actually fun.
                </p>
              </div>

              {/* Color Switcher Toy */}
              <div className="p-3.5 rounded-2xl bg-white/85 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal">Pick a card color:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFeatureCardColor('note-yellow')}
                    className="w-6 h-6 rounded-full bg-sunshine border-2 border-charcoal hover:scale-110 transition"
                  />
                  <button
                    onClick={() => setFeatureCardColor('note-mint')}
                    className="w-6 h-6 rounded-full bg-mint border-2 border-charcoal hover:scale-110 transition"
                  />
                  <button
                    onClick={() => setFeatureCardColor('note-coral')}
                    className="w-6 h-6 rounded-full bg-coral border-2 border-charcoal hover:scale-110 transition"
                  />
                  <button
                    onClick={() => setFeatureCardColor('note-sky')}
                    className="w-6 h-6 rounded-full bg-sky border-2 border-charcoal hover:scale-110 transition"
                  />
                  <button
                    onClick={() => setFeatureCardColor('note-lavender')}
                    className="w-6 h-6 rounded-full bg-lavender border-2 border-charcoal hover:scale-110 transition"
                  />
                </div>
              </div>
            </div>

            {/* 4. Find Anything in a Blink */}
            <div className="md:col-span-2 rounded-[32px] p-7 note-sky tactile-card flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="w-12 h-12 rounded-2xl bg-white border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-2xl">
                  🔍
                </span>
                <h3 className="font-display text-2xl font-bold text-charcoal">
                  Find Anything in a Blink
                </h3>
                <p className="text-charcoal/85 text-sm sm:text-base font-medium leading-relaxed">
                  Search by any word or filter by what's still <strong>To-Do</strong> vs. <strong>Finished 🎉</strong> so nothing ever slips through the cracks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/85 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-around text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-sunshine/60 border border-charcoal">All (14)</span>
                <span className="px-2.5 py-1 rounded-lg bg-coral/30 border border-charcoal">To Do (5)</span>
                <span className="px-2.5 py-1 rounded-lg bg-mint/50 border border-charcoal">Finished (9)</span>
              </div>
            </div>

            {/* 5. Private & Safe for Your Eyes Only */}
            <div className="md:col-span-2 rounded-[32px] p-7 note-coral tactile-card flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="w-12 h-12 rounded-2xl bg-white border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-2xl">
                  🔒
                </span>
                <h3 className="font-display text-2xl font-bold text-charcoal">
                  Private &amp; Safe for Your Eyes Only
                </h3>
                <p className="text-charcoal/85 text-sm sm:text-base font-medium leading-relaxed">
                  Sign in effortlessly and rest easy knowing your personal thoughts, gift ideas, and daily lists are locked safely in your private account.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/85 border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-between text-xs font-bold text-charcoal">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-heart-circle-check text-coral text-base" />
                  <span>Safe &amp; Private Diary Lock</span>
                </span>
                <span className="underline cursor-pointer" onClick={() => openAuth('signin')}>
                  Preview
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
             5. "HOW IT WORKS" IN 3 JOYFUL STEPS
        =========================================== */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-sunshine border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] font-hand text-2xl font-bold text-charcoal">
              <span>☀️ Easy as 1 - 2 - 3</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-charcoal">
              How ChirpNotes Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="sunny-glass rounded-[32px] p-7 tactile-card relative">
              <div className="w-12 h-12 rounded-2xl bg-coral text-white font-display font-bold text-xl border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center mb-5">
                1
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                Speak or Type Naturally
              </h3>
              <p className="text-charcoal/80 text-sm sm:text-base font-medium leading-relaxed">
                Tap the microphone button and talk just like you would to a friend—no special commands or stiff formatting needed.
              </p>
              <div className="mt-5 p-3 rounded-2xl bg-sunshine/30 border-2 border-charcoal/20 font-hand text-xl font-bold text-charcoal">
                "Remind me to water the ferns on Sunday 🌱"
              </div>
            </div>

            {/* Step 2 */}
            <div className="sunny-glass rounded-[32px] p-7 tactile-card relative">
              <div className="w-12 h-12 rounded-2xl bg-sunshine text-charcoal font-display font-bold text-xl border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center mb-5">
                2
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                Watch Your Board Update
              </h3>
              <p className="text-charcoal/80 text-sm sm:text-base font-medium leading-relaxed">
                Your friendly helper automatically creates a colorful note, picks the right tag, or checks off errands you've finished.
              </p>
              <div className="mt-5 p-3 rounded-2xl bg-mint/30 border-2 border-charcoal/20 font-hand text-xl font-bold text-charcoal">
                ✨ Added to #weekend with a sunny card!
              </div>
            </div>

            {/* Step 3 */}
            <div className="sunny-glass rounded-[32px] p-7 tactile-card relative">
              <div className="w-12 h-12 rounded-2xl bg-mint text-charcoal font-display font-bold text-xl border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center mb-5">
                3
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                Breeze Through Your Day
              </h3>
              <p className="text-charcoal/80 text-sm sm:text-base font-medium leading-relaxed">
                Filter by colorful tags or switch between "To Do" and "Finished 🎉" anytime to see everything at a single happy glance.
              </p>
              <div className="mt-5 p-3 rounded-2xl bg-lavender/25 border-2 border-charcoal/20 font-hand text-xl font-bold text-charcoal">
                🎉 5 errands done today — time to relax!
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
             6. BRIGHT, HAPPY FOOTER CTA
        =========================================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-[40px] p-8 sm:p-14 note-yellow tactile-card text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white border-2 border-charcoal shadow-[4px_4px_0px_#1E1E24] text-3xl">
                🌻
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-charcoal">
                Ready to clear your head?
              </h2>
              <p className="text-charcoal/85 text-base sm:text-xl font-medium">
                Turn your scattered thoughts into neat, colorful sticky notes just by speaking out loud. Free, private, and joyful to use every day.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => openAuth('signup')}
                  className="px-8 py-4 rounded-full bg-coral text-white font-display font-bold text-lg tactile-card hover:bg-[#ff5252] flex items-center gap-2.5"
                >
                  <span>Start Taking Notes — Free</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>
                <a
                  href="#live-board"
                  className="px-7 py-4 rounded-full bg-white text-charcoal font-display font-bold text-lg tactile-card hover:bg-cream"
                >
                  Try the Live Board First
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================
           SIMPLE SUNNY FOOTER
      =========================================== */}
      <footer className="border-t-2 border-charcoal/10 bg-cream/90 py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sunshine border-2 border-charcoal flex items-center justify-center">
              <i className="fa-solid fa-dove text-charcoal text-sm" />
            </div>
            <span className="font-display font-bold text-lg text-charcoal">ChirpNotes</span>
            <span className="text-xs text-charcoal/60 font-medium">— Made for happy, clutter-free thinking 💛</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-charcoal/75">
            <a href="#how-it-works" className="hover:text-coral transition">
              How It Works
            </a>
            <a href="#features" className="hover:text-coral transition">
              Features
            </a>
            <a href="#live-board" className="hover:text-coral transition">
              Live Note Board
            </a>
            <button onClick={() => openAuth('signin')} className="hover:text-coral transition">
              Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* ==========================================
           FRIENDLY SIGN-IN / SIGN-UP MODAL
      =========================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cream rounded-[32px] max-w-md w-full p-7 sm:p-8 tactile-card relative animate-pop-in">
            {/* Close button */}
            <button
              onClick={closeAuth}
              className="absolute right-5 top-5 w-9 h-9 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal hover:bg-coral hover:text-white transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-sunshine border-2 border-charcoal shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-2xl">
                🐤
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-charcoal">
                  {authMode === 'signup' ? 'Welcome to ChirpNotes!' : 'Welcome Back!'}
                </h3>
                <p className="text-xs font-bold text-charcoal/65">
                  Your private, sunny space for every thought
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-2xl border-2 border-charcoal mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                }}
                className={`py-2 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition ${authMode === 'signup'
                    ? 'bg-sunshine text-charcoal border-2 border-charcoal shadow-[2px_2px_0px_#1E1E24]'
                    : 'text-charcoal/70 hover:text-charcoal'
                  }`}
              >
                ✨ Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className={`py-2 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition ${authMode === 'signin'
                    ? 'bg-sunshine text-charcoal border-2 border-charcoal shadow-[2px_2px_0px_#1E1E24]'
                    : 'text-charcoal/70 hover:text-charcoal'
                  }`}
              >
                🔑 Sign In
              </button>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-coral/20 border-2 border-coral text-xs font-bold text-charcoal flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-coral" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-charcoal mb-1">
                    👋 What should we call you?
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya or Sam"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-charcoal font-semibold text-sm text-charcoal focus:outline-none focus:ring-4 focus:ring-sunshine/60"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-charcoal mb-1">
                  💌 Your Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-charcoal font-semibold text-sm text-charcoal focus:outline-none focus:ring-4 focus:ring-sunshine/60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-charcoal">
                    🗝️ Secret Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-coral hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'} 👀
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-charcoal font-semibold text-sm text-charcoal focus:outline-none focus:ring-4 focus:ring-sunshine/60"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-coral text-white font-display font-bold text-base tactile-card hover:bg-[#ff5252] flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isAuthLoading ? (
                  <span>Opening your desk...</span>
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Start Taking Notes — Free' : 'Hop Into My Desk'}</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                  setAuthError('');
                }}
                className="text-xs font-bold text-charcoal/70 hover:text-charcoal underline"
              >
                {authMode === 'signup'
                  ? 'Already have an account? Sign in here'
                  : "Don't have an account yet? Create one free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
