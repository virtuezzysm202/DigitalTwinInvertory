import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Sparkles, Trash2, Loader2 } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'Dimana lokasi item ITEM-01?',
  'Tampilkan item dengan stok rendah',
  'Berapa total item di inventory?',
  'Berapa zona yang ada?',
  'Item mana yang stoknya kosong?',
  'Rekomendasikan item yang perlu di-restock'
];

const INITIAL_MESSAGE = {
  id: 1,
  sender: 'ai',
  text: 'Halo! Saya asisten inventory TwinStock. Tanyakan apa saja tentang stok, lokasi barang dan zona.',
  intent: null
};

export default function AIAssistant() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const token = () => localStorage.getItem('token');

  // Auto scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || isLoading) return;

    setError(null);
    setInputText('');

    // Tambah pesan user ke chat
    const userMsg = { id: Date.now(), sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/ai/chat',
        { question: q },
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.answer || 'Tidak ada jawaban.',
        intent: res.data.intent || null
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: err.response?.data?.answer || 'Gagal menghubungi server. Pastikan backend berjalan.',
        intent: 'error'
      };
      setMessages(prev => [...prev, errMsg]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => sendQuestion(inputText);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setError(null);
  };

  const renderText = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  const getIntentBadge = (intent) => {
    if (!intent || intent === 'error') return null;
    const map = {
      search_item:            { label: 'Lokasi Item',  color: 'bg-blue-50 text-blue-600' },
      check_stock:            { label: 'Cek Stok',     color: 'bg-green-50 text-green-600' },
      low_stock:              { label: 'Low Stock',    color: 'bg-orange-50 text-orange-600' },
      empty_stock:            { label: 'Stok Kosong',  color: 'bg-red-50 text-red-600' },
      count_item:             { label: 'Hitung Item',  color: 'bg-purple-50 text-purple-600' },
      count_zone:             { label: 'Hitung Zona',  color: 'bg-indigo-50 text-indigo-600' },
      room_information:       { label: 'Info Room',    color: 'bg-teal-50 text-teal-600' },
      zone_information:       { label: 'Info Zona',    color: 'bg-cyan-50 text-cyan-600' },
      restock_recommendation: { label: 'Restock',      color: 'bg-yellow-50 text-yellow-700' },
      total_value:            { label: 'Nilai Total',  color: 'bg-emerald-50 text-emerald-600' },
      unknown:                { label: 'Tidak Dikenal',color: 'bg-gray-100 text-gray-500' },
      no_layout:              { label: 'No Layout',    color: 'bg-gray-100 text-gray-500' },
    };
    const badge = map[intent];
    if (!badge) return null;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color} mt-1 self-start`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 space-y-4 p-2 md:p-0">

      {/* HEADER */}
      <div className="flex justify-between items-start shrink-0 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Tanyakan apa saja tentang inventory, stok, dan lokasi barang</p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Trash2 size={16} /> Clear Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Header box */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 shrink-0">
          <Sparkles className="text-green-600" size={20} />
          <span className="font-semibold text-gray-800">TwinStock AI</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-full">
            TensorFlow
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex flex-col max-w-[80%] md:max-w-[65%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 text-sm leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-green-700 text-white rounded-2xl rounded-tr-sm shadow-sm'
                    : msg.intent === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-2xl rounded-tl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                }`}>
                  {renderText(msg.text)}
                </div>
                {msg.sender === 'ai' && getIntentBadge(msg.intent)}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-tl-sm p-4 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Sedang memproses...</span>
              </div>
            </div>
          )}

          {/* Suggested prompts yang hanya muncul di awal chat */}
          {messages.length <= 1 && !isLoading && (
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-400 mb-3">Coba tanyakan:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuestion(prompt)}
                    className="text-left text-xs text-green-700 bg-green-50 border border-green-100 font-medium py-2 px-3 rounded-full hover:bg-green-100 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pertanyaan... (Enter untuk kirim)"
              disabled={isLoading}
              className="w-full py-4 pl-4 pr-14 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI dapat membuat kesalahan. Verifikasi data penting secara langsung.
          </p>
        </div>

      </div>
    </div>
  );
}