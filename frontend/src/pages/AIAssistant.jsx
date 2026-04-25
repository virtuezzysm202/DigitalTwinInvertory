import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AIAssistant() {
  const [inputText, setInputText] = useState('');

  // Data statis untuk riwayat chat sementara
  const messages = [
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Hello Admin! I am your TwinStock AI Assistant. I can help you analyze stock levels, optimize your 2D layout, or generate reports. How can I assist you today?' 
    },
    { 
      id: 2, 
      sender: 'user', 
      text: 'Which zone currently has the lowest stock of electronics?' 
    },
    { 
      id: 3, 
      sender: 'ai', 
      text: 'Based on your current inventory data, **Zone A** is running low on "Logitech Wireless Mouse" (0 in stock) and "DDR4 16GB RAM" (only 3 in stock). I recommend creating a restock order for Zone A.' 
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Header AI Assistant */}
      <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800">TwinStock AI</h1>
          <p className="text-xs text-gray-500">Powered by advanced inventory analytics</p>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto flex flex-col gap-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === 'ai' ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            
            {/* Balon Pesan */}
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
              msg.sender === 'user' 
                ? 'bg-green-700 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Area Input (Ketik Pesan) */}
      <div className="bg-white p-4 rounded-b-xl border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400 transition-all">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your inventory, layouts, or reports..." 
            className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-gray-700"
          />
          <button className="bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-lg transition-colors flex items-center justify-center">
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI can make mistakes. Always verify important inventory data.
        </p>
      </div>
    </div>
  );
}