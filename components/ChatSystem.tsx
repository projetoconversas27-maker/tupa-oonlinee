
import React, { useState, useEffect, useRef } from 'react';
import { RideRequest, ChatMessage } from '../types';

interface ChatSystemProps {
  ride: RideRequest;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ ride, onSendMessage, onClose }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ride.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header do Chat */}
        <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
          <div className="relative">
            <img src={ride.driverInfo?.photo} alt={ride.driverName} className="w-12 h-12 rounded-2xl object-cover shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-gray-900 truncate uppercase tracking-tight">{ride.driverName}</h4>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online • Motorista Parceiro</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">
          {ride.messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
              <i className="fa-solid fa-comments text-5xl mb-4"></i>
              <p className="text-xs font-black uppercase tracking-widest">Inicie a conversa com seu motorista</p>
            </div>
          ) : (
            ride.messages?.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-semibold shadow-sm ${
                  msg.sender === 'passenger' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.text}
                  <div className={`text-[9px] mt-1 opacity-50 ${msg.sender === 'passenger' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold focus:outline-none focus:border-blue-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatSystem;
