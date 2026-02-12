
import React, { useState } from 'react';

export interface Theme {
  name: string;
  class: string;
  color: string;
}

export const themes: Theme[] = [
  // Linha 1
  { name: 'Azul', class: 'bg-blue-600', color: '#2563eb' },
  { name: 'Esmeralda', class: 'bg-emerald-600', color: '#059669' },
  { name: 'Roxo', class: 'bg-purple-600', color: '#9333ea' },
  { name: 'Grafite', class: 'bg-slate-800', color: '#1e293b' },
  // Linha 2
  { name: 'Carmesim', class: 'bg-rose-600', color: '#e11d48' },
  { name: 'Âmbar', class: 'bg-amber-600', color: '#d97706' },
  { name: 'Indigo', class: 'bg-indigo-600', color: '#4f46e5' },
  { name: 'Rosa', class: 'bg-pink-600', color: '#db2777' },
  // Linha 3 (Novas)
  { name: 'Vermelho', class: 'bg-red-600', color: '#dc2626' },
  { name: 'Laranja', class: 'bg-orange-500', color: '#f97316' },
  { name: 'Amarelo', class: 'bg-yellow-500', color: '#eab308' },
  { name: 'Lima', class: 'bg-lime-500', color: '#84cc16' },
  // Linha 4 (Novas)
  { name: 'Verde', class: 'bg-green-600', color: '#16a34a' },
  { name: 'Teal', class: 'bg-teal-500', color: '#14b8a6' },
  { name: 'Ciano', class: 'bg-cyan-500', color: '#06b6d4' },
  { name: 'Sky', class: 'bg-sky-500', color: '#0ea5e9' },
  // Linha 5 (Novas)
  { name: 'Violeta', class: 'bg-violet-600', color: '#7c3aed' },
  { name: 'Fúcsia', class: 'bg-fuchsia-600', color: '#c026d3' },
  { name: 'Stone', class: 'bg-stone-600', color: '#57534e' },
  { name: 'Cinza', class: 'bg-gray-500', color: '#6b7280' },
  // Linha 6 (Especiais/Darker)
  { name: 'Noite', class: 'bg-zinc-950', color: '#09090b' },
  { name: 'Vinho', class: 'bg-red-950', color: '#450a0a' },
  { name: 'Floresta', class: 'bg-green-950', color: '#064e3b' },
  { name: 'Abismo', class: 'bg-blue-950', color: '#172554' },
];

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isInline?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange, isInline }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Se for inline (no header), usamos um container relativo e um botão minúsculo
  const containerClasses = isInline 
    ? "relative inline-block z-[100]" 
    : "fixed top-4 right-4 z-[100]";
    
  const buttonClasses = isInline
    ? "w-4 h-4 rounded-full border border-white/40 bg-white/20 flex items-center justify-center text-[8px] text-white hover:bg-white/40 transition-all active:scale-90"
    : "w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg active:scale-90";

  return (
    <div className={containerClasses}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        title="Trocar Cor do Painel"
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-palette'}`}></i>
      </button>

      {isOpen && (
        <div className={`absolute ${isInline ? 'top-6 left-0' : 'top-12 right-0'} bg-white rounded-3xl shadow-2xl p-4 border border-gray-100 min-w-[200px] animate-in fade-in zoom-in slide-in-from-top-2 duration-200`}>
          <div className="flex justify-between items-center mb-3 px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temas ({themes.length})</p>
            <span className="text-[10px] font-medium text-gray-300">Selecione uma cor</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  onThemeChange(theme);
                  setIsOpen(false);
                }}
                className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-125 hover:shadow-md active:scale-95 ${
                  currentTheme.name === theme.name ? 'border-gray-800 ring-2 ring-gray-200 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: theme.color }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
