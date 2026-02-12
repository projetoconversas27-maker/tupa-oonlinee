
import React, { useState, useEffect } from 'react';
import ThemeSwitcher, { Theme } from './ThemeSwitcher';

interface HeaderProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ currentTheme, onThemeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <header className="flex flex-col md:flex-row items-center justify-between py-2 px-2 gap-2 mb-2 relative">
      <div className="flex items-center gap-6">
        {/* Futuristic Clock Badge */}
        <div className="relative group animate-in fade-in slide-in-from-left duration-1000">
          {/* Animated Glow Backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          
          <div className="relative flex items-center bg-black/40 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/20 shadow-2xl animate-tech-scan overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/10 group-hover:rotate-12 transition-transform">
                <i className="fa-regular fa-clock text-white text-sm"></i>
              </div>
              
              <div className="flex items-baseline font-mono">
                {/* Hours */}
                <span className="text-white text-2xl font-black tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {hours}
                </span>
                
                {/* Separator 1 */}
                <span className="text-blue-400 text-2xl font-black mx-0.5 animate-clock-blink">:</span>
                
                {/* Minutes */}
                <span className="text-white text-2xl font-black tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {minutes}
                </span>

                {/* Separator 2 */}
                <span className="text-blue-400 text-2xl font-black mx-0.5 animate-clock-blink">:</span>

                {/* Seconds */}
                <span className="text-emerald-400 text-2xl font-black tracking-tighter drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] w-[1.4em] text-center">
                  {seconds}
                </span>

                <span className="ml-2 text-[10px] text-emerald-400 font-black uppercase tracking-widest hidden sm:block">
                  Live
                </span>
              </div>
            </div>
            
            {/* Visual bits for tech feel */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-20">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col relative">
          {/* Seletor de Tema muito pequeno posicionado encima da saudação */}
          <div className="mb-0.5 ml-1">
            <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} isInline />
          </div>
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter drop-shadow-lg uppercase leading-none">
            {getGreeting()}
          </h1>
        </div>
      </div>
      
      <div className="hidden lg:flex items-center gap-4 text-right">
        <div className="flex flex-col items-end">
          <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">QuickRide Express</span>
          <span className="text-white/20 text-[8px] font-medium uppercase tracking-[0.1em]">Dashboard v3.2.0</span>
        </div>
        <div className="h-8 w-[1px] bg-white/10"></div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
          <i className="fa-solid fa-satellite-dish text-white/30 text-xs"></i>
        </div>
      </div>
    </header>
  );
};

export default Header;
