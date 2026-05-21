import React, { useState, useRef, useEffect } from 'react';
import type { AgentMessage } from '../types';
import { queryAgent } from '../services/agentService';

interface AiChatProps {
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  onNotesChange: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AiChat: React.FC<AiChatProps> = ({
  messages,
  setMessages,
  onNotesChange,
  showToast,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Set up Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening...', 'info');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        showToast(`Speech recognition error: ${event.error}`, 'error');
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        showToast('Voice transcript captured!', 'success');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput('');

    // Append user message
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await queryAgent(userPrompt);

      if (response.data.success) {
        const botMessage: AgentMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data.message,
          action: response.data.action,
          data: response.data.data,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // If an action was performed, refresh the notes dashboard
        if (response.data.action) {
          showToast(`AI executed: ${response.data.action}`, 'success');
          onNotesChange();
        }
      } else {
        throw new Error(response.data.message || 'Failed to query agent');
      }
    } catch (err: any) {
      console.error('AI agent query error:', err);
      const errMsg = err.response?.data?.message || err.message || 'AI failed to respond. Please check your setup.';
      
      const errorMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${errMsg}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    showToast('Chat history cleared locally', 'info');
  };

  return (
    <div className="glass" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>AI Note Assistant</h3>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>● Online</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearChat} style={{ fontSize: '12px' }}>
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '20px',
            gap: '12px',
          }}>
            <span style={{ fontSize: '32px' }}>💡</span>
            <p style={{ fontSize: '14px', maxWidth: '280px', lineHeight: '1.6' }}>
              Ask me to create, search, update, or complete notes.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
              width: '100%',
              maxWidth: '300px',
              marginTop: '12px',
            }}>
              <span className="badge badge-tag" style={{ cursor: 'pointer', justifyContent: 'center' }} onClick={() => setInput('Create a note named Ideas')}>
                "Create a note named Ideas"
              </span>
              <span className="badge badge-tag" style={{ cursor: 'pointer', justifyContent: 'center' }} onClick={() => setInput('Search notes about work')}>
                "Search notes about work"
              </span>
              <span className="badge badge-tag" style={{ cursor: 'pointer', justifyContent: 'center' }} onClick={() => setInput('Mark my Ideas note as completed')}>
                "Mark my Ideas note as completed"
              </span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{
                background: isUser ? 'var(--violet)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                border: isUser ? 'none' : '1px solid var(--border)',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}>
                {msg.content}

                {/* Show details if tool was called */}
                {msg.action && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '11px',
                    color: 'var(--violet-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⚡</span>
                      <strong>Action:</strong> <span>{msg.action}</span>
                    </div>
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                padding: '0 4px',
              }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="glass" style={{
              padding: '16px 20px',
              borderRadius: '16px 16px 16px 2px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} btn-icon`}
          style={{ borderRadius: '50%', flexShrink: 0 }}
          title={isListening ? 'Stop Listening' : 'Voice Input'}
          disabled={isLoading}
        >
          🎤
        </button>
        <input
          type="text"
          className="input"
          placeholder={isListening ? 'Listening...' : 'Ask assistant...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isListening}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!input.trim() || isLoading || isListening}
          style={{ padding: '10px 16px' }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
