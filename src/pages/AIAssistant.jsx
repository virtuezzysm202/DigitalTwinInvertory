import React, { useState } from 'react';
import { Send, Sparkles, User, Trash2 } from 'lucide-react';

export default function AIAssistant() {
  const [inputText, setInputText] = useState('');

  // Data riwayat chat disesuaikan dengan tone/konteks TwinStock
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: "Hi! I'm your inventory assistant. You can ask me anything about your stock and locations." 
    },
    { 
      id: 2, 
      sender: 'user', 
      text: 'Which zone currently has the lowest stock of electronics?' 
    },
    { 
      id: 3, 
      sender: 'ai', 
      text: 'Based on your current inventory data, **Storage A** is running low on "Box Sensor 01" and there are no units left for "Lubricant Oil". I recommend creating a restock order.' 
    },
  ]);

  const handleClear = () => setMessages([messages[0]]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 space-y-4 p-2 md:p-0">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex justify-between items-start shrink-0 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            AI Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ask anything about your inventory, layouts, or stock</p>
        </div>
        <button 
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Trash2 size={16} /> Clear Chat
        </button>
      </div>

      {/* 2. AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
        
        {/* Header Chat Box Internal */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <Sparkles className="text-green-600" size={20} />
          <span className="font-semibold text-gray-800">TwinStock AI</span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              
              {/* Balon Pesan */}
              <div className={`max-w-[80%] md:max-w-[60%] p-4 text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-green-700 text-white rounded-2xl rounded-tr-sm shadow-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
              }`}>
                {/* Parse simple markdown for bolding */}
                {msg.text.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </div>
            </div>
          ))}

          {/* Suggested Prompts (Hanya tampil jika chat sepi / baru mulai) */}
          {messages.length <= 1 && (
            <div className="mt-4 max-w-[80%] md:max-w-[60%]">
              <p className="text-xs font-bold text-gray-500 mb-3 ml-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                <button className="text-left text-sm text-green-700 bg-green-50 border border-green-100 font-medium py-2 px-4 rounded-full hover:bg-green-100 transition-colors">
                  Where is the CNC Machine?
                </button>
                <button className="text-left text-sm text-green-700 bg-green-50 border border-green-100 font-medium py-2 px-4 rounded-full hover:bg-green-100 transition-colors">
                  Show me items with low stock
                </button>
                <button className="text-left text-sm text-green-700 bg-green-50 border border-green-100 font-medium py-2 px-4 rounded-full hover:bg-green-100 transition-colors">
                  Move 10 boxes from Storage A to Production Area
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="relative max-w-4xl mx-auto">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything..." 
              className="w-full py-4 pl-4 pr-14 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors shadow-sm">
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Verify important data.
          </p>
        </div>

      </div>
    </div>
  );
}