/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Trash2 } from 'lucide-react';

export default function Chatbot({ onDataChanged }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // ====================================================
  // 1. NGAMBIL INGATAN DARI BROWSER (LOCALSTORAGE)
  // ====================================================
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('rental_ai_memory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // ====================================================
  // 2. NYATET TIAP ADA CHAT BARU KE LOCALSTORAGE
  // ====================================================
  useEffect(() => {
    localStorage.setItem('rental_ai_memory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping, isChatOpen]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    // Bawa ingatan saat ini untuk disetor ke backend
    const currentHistory = [...chatHistory];
    
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://127.0.0.1:8787/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // KIRIM PESAN BARU + INGATAN MASA LALU
        body: JSON.stringify({ message: userMsg, history: currentHistory })
      });
      const data = await res.json();
      
      setChatHistory(prev => [...prev, { sender: 'bot', text: data.reply }]);
      
      if ((data.reply.includes("sukses") || data.reply.includes("Beres")) && onDataChanged) {
          onDataChanged(); 
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: "Aduh server lagi sibuk bos." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fungsi buat ngereset ingatan AI
  const clearMemory = () => {
    if (window.confirm('Yakin mau hapus semua ingatan obrolan ini bos?')) {
      setChatHistory([]);
      localStorage.removeItem('rental_ai_memory');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isChatOpen ? (
        <div className="bg-white w-80 sm:w-[400px] h-[550px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* HEADER DENGAN TOMBOL CLEAR MEMORY */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md z-10">
            <span className="font-bold flex items-center gap-2">
              <MessageCircle size={18}/> Rental AI
            </span>
            <div className="flex items-center gap-3">
              {chatHistory.length > 0 && (
                <button onClick={clearMemory} className="hover:text-red-300 transition-colors flex items-center gap-1 text-xs bg-blue-700/50 px-2 py-1 rounded" title="Hapus Ingatan">
                  <Trash2 size={14}/> Reset
                </button>
              )}
              <button onClick={() => setIsChatOpen(false)} className="hover:text-blue-200 transition-colors">
                <X size={20}/>
              </button>
            </div>
          </div>
          
          {/* AREA CHAT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50">
            {chatHistory.length === 0 && (
                <div className="text-center text-slate-400 mt-10">
                  <MessageCircle size={40} className="mx-auto mb-2 opacity-20" />
                  <p>Halo! Ada yang bisa dibantu hari ini?</p>
                  <p className="text-xs mt-1">(Shift + Enter untuk baris baru)</p>
                </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] shadow-sm whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="text-slate-400 text-xs italic ml-2 flex items-center gap-2">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-75">●</span>
                <span className="animate-pulse delay-150">●</span>
                AI sedang berpikir...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AREA KETIK PESAN */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-end">
            <textarea 
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-100 resize-none custom-scrollbar min-h-[44px] max-h-[120px]" 
              rows="1"
              placeholder="Ketik pesan..." 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || !chatInput.trim()} 
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors shrink-0 mb-0.5"
            >
              <Send size={18}/>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsChatOpen(true)} 
          className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-110 hover:shadow-blue-600/30 transition-all flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}