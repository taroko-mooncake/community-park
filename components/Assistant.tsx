import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { getGardeningAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Button } from './Button';

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Rooty, your gardening assistant. Ask me about plant care, park maintenance tips, or identifying tasks!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const advice = await getGardeningAdvice(input);

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: advice
    }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
      <div className="bg-emerald-600 p-4 text-white flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <div>
          <h2 className="font-semibold text-lg">Rooty the Garden Sage</h2>
          <p className="text-xs text-emerald-100">AI-Powered Advisor</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'model' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-600'
            }`}>
              {msg.role === 'model' ? <Sparkles size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
               <Sparkles size={16} />
             </div>
             <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-stone-100">
               <div className="flex gap-1">
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-stone-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for advice..."
            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};
