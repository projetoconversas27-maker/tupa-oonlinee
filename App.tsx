
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RideForm from './components/RideForm';
import RideList from './components/RideList';
import ChatSystem from './components/ChatSystem';
import { themes, Theme } from './components/ThemeSwitcher';
import { RideRequest, RideStatus, RideCategory, DriverInfo, ChatMessage } from './types';

// Mock history initial state
const INITIAL_MOCK_HISTORY: RideRequest[] = [
  {
    id: 'sim-active-1',
    osNumber: '29384756',
    passengerName: 'Carlos Oliveira',
    passengerCpf: '123.***.***-45',
    passengerWhatsapp: '(93) 98118-3360',
    destination: 'Terminal Rodoviário, Plataforma A',
    category: RideCategory.CARRO,
    status: RideStatus.ACCEPTED,
    driverName: 'Marcos Souza',
    driverInfo: { 
      name: "Marcos Souza", 
      photo: "https://i.pravatar.cc/150?u=marcos", 
      rating: 4.9, 
      vehicle: "Fiat Cronos Branco", 
      plate: "QWJ-9012" 
    },
    distanceKm: 1.2,
    createdAt: Date.now() - 1000 * 60 * 5,
    messages: [
      { id: 'm1', sender: 'driver', text: 'Estou chegando no ponto de encontro!', timestamp: Date.now() - 1000 * 60 * 2 }
    ]
  }
];

type AppView = 'HOME' | 'FORM' | 'DASHBOARD';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('HOME');
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [history, setHistory] = useState<RideRequest[]>(INITIAL_MOCK_HISTORY);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [activeChatRideId, setActiveChatRideId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRides(prevRides => {
        let changed = false;
        const newRides = prevRides.map(ride => {
          let updatedRide = { ...ride };
          if (ride.status === RideStatus.ACCEPTED) {
            if (ride.distanceKm !== undefined && ride.distanceKm > 0.1) {
              changed = true;
              updatedRide.distanceKm = Math.max(0.1, ride.distanceKm - 0.1);
            } else if (ride.distanceKm !== undefined && ride.distanceKm <= 0.1) {
               if (Math.random() > 0.95) {
                 changed = true;
                 updatedRide.status = RideStatus.FINISHED;
                 setHistory(h => [updatedRide, ...h]);
               }
            }
          }
          return updatedRide;
        });
        const filtered = newRides.filter(r => r.status !== RideStatus.FINISHED);
        return changed || filtered.length !== prevRides.length ? filtered : prevRides;
      });

      setHistory(prevHistory => prevHistory.map(ride => {
        if (ride.status === RideStatus.ACCEPTED && ride.distanceKm !== undefined && ride.distanceKm > 0.1) {
          return { ...ride, distanceKm: Math.max(0.1, ride.distanceKm - 0.05) };
        }
        return ride;
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleAddRide = (data: {
    destination: string;
    passengerName: string;
    passengerCpf: string;
    passengerWhatsapp: string;
    category: RideCategory;
    driverInfo?: DriverInfo;
  }) => {
    const randomOS = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newRide: RideRequest = {
      id: Date.now().toString(),
      osNumber: randomOS,
      destination: data.destination,
      passengerName: data.passengerName,
      passengerCpf: data.passengerCpf,
      passengerWhatsapp: data.passengerWhatsapp,
      category: data.category,
      status: RideStatus.ACCEPTED,
      driverName: data.driverInfo?.name,
      driverInfo: data.driverInfo,
      distanceKm: 2.5 + Math.random() * 3,
      messages: [],
      createdAt: Date.now(),
    };
    setRides(prev => [newRide, ...prev]);
    setView('DASHBOARD');
  };

  const handleSendMessage = (rideId: string, text: string) => {
    const updateMsg = (ride: RideRequest) => {
      if (ride.id === rideId) {
        const newMsg: ChatMessage = { id: Date.now().toString(), sender: 'passenger', text, timestamp: Date.now() };
        return { ...ride, messages: [...(ride.messages || []), newMsg] };
      }
      return ride;
    };
    setRides(prev => prev.map(updateMsg));
    setHistory(prev => prev.map(updateMsg));

    setTimeout(() => {
      const reply = (ride: RideRequest) => {
        if (ride.id === rideId) {
          const driverReply: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'driver', text: "Entendido, estou a caminho!", timestamp: Date.now() };
          return { ...ride, messages: [...(ride.messages || []), driverReply] };
        }
        return ride;
      };
      setRides(prev => prev.map(reply));
      setHistory(prev => prev.map(reply));
    }, 1500);
  };

  const handleCancelRide = (rideId: string) => {
    setRides(prev => prev.filter(r => r.id !== rideId));
    setHistory(prev => prev.filter(r => r.id !== rideId));
    setActiveChatRideId(null);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const activeChatRide = [...rides, ...history].find(r => r.id === activeChatRideId);

  return (
    <div className={`h-screen overflow-hidden transition-all duration-1000 ${currentTheme.class} p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center relative`}>
      
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full h-full max-w-[1400px] flex flex-col relative z-10">
        <Header currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
        
        {view === 'HOME' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in fade-in duration-700">
            <div className="text-center mb-12">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-[3rem] border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                <i className="fa-solid fa-car-side text-6xl text-white"></i>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
                QUICKRIDE EXPRESS
              </h2>
              <p className="text-white/60 font-medium uppercase tracking-[0.4em] text-xs md:text-sm">
                Sua corrida a um toque de distância
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-md px-6">
              <button 
                onClick={() => setView('FORM')}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 py-8 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 group"
              >
                <i className="fa-solid fa-plus-circle text-2xl group-hover:rotate-90 transition-transform"></i>
                Nova Corrida
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowHistory(true)}
                  className="bg-black/20 backdrop-blur-md border border-white/10 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95"
                >
                  <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                  Histórico
                </button>
                <button 
                  onClick={() => setView('DASHBOARD')}
                  className="bg-black/20 backdrop-blur-md border border-white/10 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95"
                >
                  <i className="fa-solid fa-gauge mr-2"></i>
                  Painel
                </button>
              </div>
            </div>
          </div>
        )}

        {(view === 'FORM' || view === 'DASHBOARD') && (
          <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-1">
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="mb-2">
                <button 
                  onClick={() => setView('HOME')}
                  className="text-white/60 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
                >
                  <i className="fa-solid fa-arrow-left"></i> Voltar ao Início
                </button>
              </div>
              <RideForm onSubmit={handleAddRide} onOpenHistory={() => setShowHistory(true)} />
            </div>
            
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 bg-black/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-4 md:px-8 md:py-6 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-1000 delay-200">
              <RideList 
                rides={rides} 
                onOpenChat={(ride) => setActiveChatRideId(ride.id)}
              />
            </div>
          </main>
        )}

        <footer className="pt-2 pb-2 shrink-0"></footer>
      </div>

      {activeChatRide && (
        <ChatSystem 
          ride={activeChatRide} 
          onSendMessage={(text) => handleSendMessage(activeChatRide.id, text)}
          onClose={() => setActiveChatRideId(null)}
        />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-white animate-in slide-in-from-top duration-500 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
              <div>
                <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                  <i className="fa-solid fa-folder-open text-blue-600"></i>
                  HISTÓRICO
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-[0.4em] mt-2">Central de Registros QuickRide</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)} 
                className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-black text-white flex items-center justify-center transition-all hover:bg-red-600 active:scale-90 shadow-2xl group border-none"
              >
                <i className="fa-solid fa-xmark text-3xl group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.map((ride) => (
                <div 
                  key={ride.id} 
                  className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 relative overflow-hidden group hover:bg-blue-50/50 transition-all hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -translate-y-20 translate-x-20"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-black text-white text-[13px] font-black px-5 py-2.5 rounded-2xl tracking-[0.15em] shadow-lg">
                      OS {ride.osNumber}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registro</span>
                      <span className="text-lg font-mono font-black text-gray-900">{formatTime(ride.createdAt)}</span>
                    </div>
                  </div>
                  <div className="space-y-5 relative z-10">
                    <div>
                      <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Passageiro</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">{ride.passengerName}</p>
                    </div>
                    <div className="flex items-start gap-4 bg-white/90 p-6 rounded-3xl border border-white shadow-sm">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-map-location-dot"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino</p>
                        <p className="text-sm text-gray-700 font-bold leading-relaxed">{ride.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3">
                        <div className="flex-1 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                          <i className={`fa-solid ${ride.category === RideCategory.MOTO ? 'fa-motorcycle' : 'fa-car'} text-gray-400 text-sm`}></i>
                          <span className="text-[11px] font-black uppercase text-gray-700 tracking-tighter">{ride.category}</span>
                        </div>
                        <div className={`flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ${ride.status === RideStatus.FINISHED ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                          <span className="text-[11px] font-black uppercase tracking-tighter">{ride.status === RideStatus.FINISHED ? 'Concluída' : 'Ativa'}</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSupport && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setShowSupport(false)}></div>
          <div className="relative bg-white rounded-[4.5rem] p-12 md:p-16 max-w-md w-full text-center animate-in zoom-in-110 duration-500 shadow-[0_0_120px_rgba(0,0,0,1)]">
            <div className="w-32 h-32 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-6xl mx-auto mb-12 shadow-inner">
              <i className="fa-solid fa-phone-volume animate-bounce"></i>
            </div>
            <h4 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Central 24h</h4>
            <div className="bg-gray-50 border-4 border-emerald-50 p-10 rounded-[3rem] mb-12 shadow-sm group">
              <p className="text-4xl md:text-5xl font-mono font-black text-emerald-600 tracking-tighter group-hover:scale-110 transition-transform duration-500">93 98118-3360</p>
            </div>
            <button onClick={() => setShowSupport(false)} className="w-full bg-black text-white py-7 rounded-3xl font-black text-sm uppercase tracking-[0.4em] transition-all active:scale-95 shadow-2xl border-none">FECHAR CANAL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
