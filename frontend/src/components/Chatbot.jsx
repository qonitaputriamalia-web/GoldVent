/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Halo! Gua Asisten AI lu. Ketik "tracking" atau "cari [nama pelanggan]".' }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // Tembak ke Hono
    try {
      const res = await fetch('http://localhost:8787/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Gagal terhubung ke server." }]);
    }
  };

  return (
    <>
      {/* Tombol Bulat Melayang */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <MessageSquare size={24} />
      </button>

      {/* Jendela Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <span className="font-semibold flex items-center gap-2"><MessageSquare size={18}/> AI Assistant</span>
            <button onClick={() => setIsOpen(false)}><X size={18}/></button>
          </div>

          {/* Area Pesan */}
          <div className="h-64 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-lg ${m.sender === 'user' ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-white border text-slate-700 self-start rounded-bl-none shadow-sm'}`}>
                {/* Render baris baru jika ada \n dari bot */}
                {m.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Area Ketik */}
          <form onSubmit={handleSend} className="border-t p-2 bg-white flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 bg-slate-100 rounded-lg outline-none text-sm" 
              placeholder="Tanya sesuatu..."
              value={input} onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg"><Send size={18}/></button>
          </form>
        </div>
      )}
    </>
  );
}