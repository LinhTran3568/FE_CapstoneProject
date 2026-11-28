import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Ticket,
  ArrowRight,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { copilotApi } from '@ticketshield/api-client';
import type { CopilotChatMessage, CopilotTicketItemDto } from '@ticketshield/types';
import { TickyAvatar, type TickyState } from './TickyAvatar';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedTickets?: CopilotTicketItemDto[];
  isStreaming?: boolean;
}

const INITIAL_MESSAGE: ChatItem = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Ticky, your smart ticket assistant. I can help you find event tickets by price, or verify resale price caps before listing.",
};

const SUGGESTIONS = [
  'Concert tickets under 1M',
  'Check VIP ticket price cap',
  'Hot concert tickets this week',
];

export const AiTicketCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tickyState, setTickyState] = useState<TickyState>('idle_calm');
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide in admin or dispute portal
  const isAdminOrDispute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/disputes');

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  if (isAdminOrDispute) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const updatedMessages: ChatItem[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: query },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);
    setTickyState('thinking');

    const history: CopilotChatMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const chatRes = await copilotApi.chat({
        message: query,
        conversationHistory: history,
        history: history,
        stream: false,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: chatRes.reply,
                suggestedTickets: chatRes.suggestedTickets,
                isStreaming: false,
              }
            : msg
        )
      );
      setTickyState('hello');
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: 'Ticky is currently busy or experiencing high traffic. Please try again in a moment.',
                isStreaming: false,
              }
            : msg
        )
      );
      setTickyState(isOpen ? 'idle2' : 'idle_calm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const handleTicketClick = (ticket: CopilotTicketItemDto) => {
    setIsOpen(false);
    navigate(`/marketplace?listingId=${ticket.listingId}&q=${encodeURIComponent(ticket.eventName)}`);
  };

  const renderFormattedMessage = (content: string) => {
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('[') && token.endsWith(')')) {
        const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          parts.push(
            <a
              key={match.index}
              href={linkUrl}
              onClick={(e) => {
                if (linkUrl.startsWith('/')) {
                  e.preventDefault();
                  setIsOpen(false);
                  navigate(linkUrl);
                }
              }}
              className="text-[#FF5A36] underline hover:text-[#ff7859] font-semibold transition-colors"
              target={linkUrl.startsWith('/') ? undefined : '_blank'}
              rel="noopener noreferrer"
            >
              {linkText}
            </a>
          );
        }
      } else if (token.startsWith('**') && token.endsWith('**')) {
        const boldText = token.slice(2, -2);
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {boldText}
          </strong>
        );
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTickyState('hello');
    } else {
      setIsOpen(false);
      setTickyState('idle_calm');
    }
  };

  return (
    <>
      {/* Free-standing Enlarged Ticky Mascot */}
      <div className="fixed bottom-2 -left-8 sm:-left-12 lg:-left-14 z-40 select-none">
        {/* Speech Bubble thông báo Chatbox khi chưa mở */}
        <AnimatePresence>
          {!isOpen && !isBubbleDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="absolute -top-3 left-24 sm:left-32 z-50 pointer-events-auto"
            >
              <div
                onClick={handleToggleOpen}
                className="relative px-3.5 py-2 rounded-2xl bg-[#0D1117]/95 border border-white/15 text-white shadow-2xl backdrop-blur-md flex items-center gap-2 group hover:border-[#FF5A36]/60 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF5A36] animate-pulse shrink-0" />
                <span className="text-xs font-medium text-[#F5F5F2] whitespace-nowrap">
                  Ask Ticky to find tickets!
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBubbleDismissed(true);
                  }}
                  className="ml-0.5 p-0.5 text-white/40 hover:text-white transition-colors rounded"
                  title="Dismiss notification"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Đuôi nhọn bong bóng thoại trỏ xuống Ticky */}
                <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-[#0D1117] border-b border-l border-white/15 rotate-[-45deg]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleToggleOpen}
          onMouseEnter={() => {
            if (!isOpen && tickyState === 'idle_calm') {
              setTickyState('idle1');
            }
          }}
          onMouseLeave={() => {
            if (!isOpen && tickyState === 'idle1') {
              setTickyState('idle_calm');
            }
          }}
          className="relative block p-0 bg-transparent border-0 outline-none cursor-pointer group transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          aria-label={isOpen ? 'Minimize Ticky' : 'Chat with Ticky'}
          title="Ticky Assistant"
        >
          {/* Nhân vật Mascot Ticky phóng to nổi bật */}
          <div className="w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.7)]">
            <TickyAvatar
              state={tickyState}
              onStateChange={setTickyState}
              className="w-full h-full scale-125 origin-bottom-left"
            />
          </div>
        </button>
      </div>

      {/* Floating Chat Modal (Mở cố định ở bên phải Mascot Ticky) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-36 lg:left-44 z-50 w-auto sm:w-[390px] h-[540px] max-h-[84vh] rounded-2xl bg-[#0D1117]/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A36]/15 border border-[#FF5A36]/30 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">Ticky</h3>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  title="New conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setTickyState('idle_calm');
                  }}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-[#FF5A36] text-white rounded-br-sm'
                        : 'bg-white/5 border border-white/10 text-[#F5F5F2] rounded-bl-sm'
                    }`}
                  >
                    {msg.content ? (
                      renderFormattedMessage(msg.content)
                    ) : msg.isStreaming ? (
                      <span className="inline-flex items-center gap-1 text-white/60">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Ticky is typing...
                      </span>
                    ) : null}
                  </div>

                  {/* Render Suggested Ticket Cards */}
                  {msg.suggestedTickets && msg.suggestedTickets.length > 0 && (
                    <div className="w-full mt-2.5 space-y-2">
                      <div className="text-[11px] font-medium text-white/50 px-1 flex items-center justify-between">
                        <span>Matching tickets on marketplace:</span>
                        <span className="text-[10px] text-[#FF5A36]">Click to view & purchase</span>
                      </div>
                      {msg.suggestedTickets.map((t) => (
                        <div
                          key={t.listingId}
                          onClick={() => handleTicketClick(t)}
                          className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#FF5A36]/60 transition-all cursor-pointer flex items-center justify-between gap-2.5 group shadow-sm hover:shadow-md hover:shadow-[#FF5A36]/5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF5A36] transition-colors">
                              {t.eventName}
                            </div>
                            <div className="text-[11px] text-[#A3A8B3] flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-white/80">{t.tierName}</span>
                              {t.seatZone && <span>• Zone {t.seatZone}</span>}
                            </div>
                            <div className="text-xs font-semibold text-[#FF5A36] mt-1 flex items-center gap-2">
                              <span>{t.resalePrice.toLocaleString('vi-VN')} đ</span>
                              {t.discountPercentage > 0 && (
                                <span className="text-[10px] text-emerald-400 font-medium">
                                  -{t.discountPercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-[#FF5A36] text-white/60 group-hover:text-white flex items-center justify-center transition-colors">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] text-white/40 group-hover:text-[#FF5A36] transition-colors font-medium">
                              View ticket
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#A3A8B3] hover:text-white transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or search for tickets..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-40 disabled:hover:bg-[#FF5A36] text-white transition-colors cursor-pointer"
                  title="Send"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiTicketCopilot;
