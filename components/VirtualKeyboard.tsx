
import React, { useState } from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose: () => void;
  layout: 'alphanumeric' | 'numeric';
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onBackspace, onClear, onClose, layout }) => {
  const [isCaps, setIsCaps] = useState(true);

  const alphanumericLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
  ];

  const numericLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'X'],
  ];

  const handleKeyClick = (key: string) => {
    if (key === 'X') {
      onBackspace();
    } else if (key === 'C') {
      onClear();
    } else {
      onKeyPress(isCaps ? key.toUpperCase() : key.toLowerCase());
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-2xl border-t border-white/10 p-4 pb-8 z-[9999] animate-in slide-in-from-bottom duration-500 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
              Teclado Inteligente QuickRide
            </span>
          </div>
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest shadow-lg active:scale-95"
          >
            Concluir
          </button>
        </div>

        {layout === 'alphanumeric' ? (
          <div className="space-y-2">
            {alphanumericLayout.map((row, i) => (
              <div key={i} className="flex justify-center gap-1.5">
                {i === 2 && (
                  <button 
                    onClick={() => setIsCaps(!isCaps)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all shadow-md ${
                      isCaps ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    <i className="fa-solid fa-arrow-up-z-a"></i>
                  </button>
                )}
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyClick(key)}
                    className="w-10 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl active:scale-90 transition-all text-lg shadow-lg"
                  >
                    {isCaps ? key.toUpperCase() : key.toLowerCase()}
                  </button>
                ))}
                {i === 3 && (
                  <button 
                    onClick={onBackspace}
                    className="w-16 h-12 md:w-20 md:h-14 bg-white/20 text-white rounded-xl flex items-center justify-center text-lg active:scale-90 transition-all shadow-md hover:bg-white/30"
                  >
                    <i className="fa-solid fa-delete-left"></i>
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-center gap-2 mt-2">
              <button 
                onClick={onClear}
                className="w-24 md:w-32 h-12 md:h-14 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-md border border-red-500/20"
              >
                Limpar
              </button>
              <button 
                onClick={() => onKeyPress(' ')}
                className="w-full max-w-sm h-12 md:h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-md"
              >
                Espaço
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {numericLayout.flat().map((key) => (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className={`h-16 md:h-20 text-2xl font-black rounded-2xl transition-all active:scale-90 shadow-xl border ${
                  key === 'X' 
                    ? 'bg-white/20 text-white hover:bg-white/30 border-white/10' 
                    : key === 'C'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20 text-sm uppercase tracking-widest'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/5'
                }`}
              >
                {key === 'X' ? <i className="fa-solid fa-delete-left"></i> : key === 'C' ? 'Limpar' : key}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
