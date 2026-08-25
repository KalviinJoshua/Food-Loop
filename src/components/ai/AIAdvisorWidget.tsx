import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const AIAdvisorWidget: React.FC = () => {
  const {
    currentUser,
    advisorMessages,
    advisorLoading,
    sendMessageToAdvisor,
    clearAdvisorChat,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [advisorMessages, advisorLoading]);

  // If user is not logged in, don't show advisor
  if (!currentUser) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || advisorLoading) return;
    const msg = inputValue;
    setInputValue('');
    await sendMessageToAdvisor(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Helper to format basic markdown (bold and lists)
  const formatText = (text: string) => {
    // Escape HTML tags to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert **bold**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary-light">$1</strong>');

    // Convert list items
    const lines = escaped.split('\n');
    const processedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return `<li class="ml-4 list-disc text-[13px] my-1">${trimmed.substring(2)}</li>`;
      }
      return line;
    });

    return processedLines.join('<br />');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary hover:bg-primary-light text-white shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer relative"
        title="AI Recovery Advisor"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-2xl">close</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl animate-pulse">smart_toy</span>
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-surface flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-90 sm:w-100 h-132 card-natural bg-white/95 backdrop-blur-md border border-outline-variant/60 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="p-4 bg-primary text-white flex items-center justify-between border-b border-primary-light/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-serif tracking-wide leading-none">
                  FoodBridge AI Advisor
                </h3>
                <span className="text-[10px] text-white/70 block mt-0.5 font-sans uppercase font-bold tracking-wider">
                  Powered by Gemini 2.5
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearAdvisorChat}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
                title="Clear Chat History"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/30">
            {advisorMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isAssistant
                        ? 'bg-white border border-outline-variant/40 text-on-surface'
                        : 'bg-primary text-on-primary font-medium'
                    }`}
                  >
                    {isAssistant ? (
                      <div
                        className="prose prose-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    )}
                    <span
                      className={`text-[9px] block mt-1.5 text-right ${
                        isAssistant ? 'text-on-surface-variant' : 'text-on-primary/60'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {advisorLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-outline-variant/40 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-outline-variant/50 flex gap-2 items-center"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-grow bg-surface/50 border border-outline-variant/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 resize-none h-9 flex items-center leading-normal"
              disabled={advisorLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || advisorLoading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                inputValue.trim() && !advisorLoading
                  ? 'bg-primary text-white hover:opacity-90 active:scale-95'
                  : 'bg-surface text-on-surface-variant/40'
              }`}
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
