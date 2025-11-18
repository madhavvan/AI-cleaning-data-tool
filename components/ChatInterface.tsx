import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2, ChevronUp } from 'lucide-react';
import { AppState, ChatMessage } from '../types';
import { queryChatBot } from '../services/geminiService';

interface ChatInterfaceProps {
  appState: AppState;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ appState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'SYSTEM ONLINE. I am the DATACLYSM Intelligence Core. How can I assist with your data operations?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Filter history to only pass text content to service (service handles formatting)
      // We exclude the very first system greeting if it's hardcoded, but here we pass it as context history
      const responseText = await queryChatBot(messages, userMsg.text, appState);
      
      const botMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center transition-all z-50 hover:scale-110"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
     return (
        <div className="fixed bottom-6 right-6 w-72 bg-slate-900 border border-cyan-500/30 rounded-t-lg shadow-2xl z-50 overflow-hidden">
             <div 
                className="p-3 bg-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-700"
                onClick={() => setIsMinimized(false)}
             >
                <div className="flex items-center gap-2 text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono font-bold">AI ASSISTANT (STANDBY)</span>
                </div>
                <div className="flex gap-2">
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <X className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                </div>
            </div>
        </div>
     )
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[500px] flex flex-col bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden font-mono">
      
      {/* Header */}
      <div className="p-3 bg-slate-900/80 border-b border-cyan-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
            <span className="text-xs font-bold text-cyan-400 tracking-widest">DATACLYSM INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="text-slate-500 hover:text-cyan-400">
                <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-rose-500">
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30'
                }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded text-xs leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                        : 'bg-cyan-950/30 text-cyan-100 border border-cyan-900/50'
                    }`}>
                        {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-600 mt-1">{msg.timestamp}</span>
                </div>
            </div>
        ))}
        {isTyping && (
            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 bg-cyan-950/30 border border-cyan-900/50 rounded flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900/80 border-t border-cyan-900/50 shrink-0">
        <div className="flex items-center gap-2 bg-black border border-slate-700 rounded px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
            <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command or query..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                disabled={isTyping}
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="text-cyan-500 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
