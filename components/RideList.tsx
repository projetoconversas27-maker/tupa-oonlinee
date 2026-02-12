
import React from 'react';
import { RideRequest, RideStatus } from '../types';

interface RideListProps {
  rides: RideRequest[];
  onOpenChat: (ride: RideRequest) => void;
}

const RideList: React.FC<RideListProps> = ({ rides, onOpenChat }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <div className="flex flex-col items-center mb-6 mt-2 px-2 shrink-0">
        <div className="flex items-center gap-4 py-3 px-6 bg-white/5 rounded-full border border-white/10">
          <i className="fa-solid fa-satellite-dish text-emerald-400 animate-pulse"></i>
          <span className="text-[11px] text-white/60 font-black uppercase tracking-[0.3em]">Monitoramento ao vivo</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {rides.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 opacity-40">
              <i className="fa-solid fa-car text-2xl"></i>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Aguardando nova solicitação</p>
          </div>
        ) : (
          rides.map((ride) => (
            <div 
              key={ride.id} 
              onClick={() => ride.status === RideStatus.ACCEPTED && onOpenChat(ride)}
              className={`bg-white/5 border border-white/10 rounded-[1.5rem] p-5 transition-all flex items-center gap-5 animate-in slide-in-from-right duration-500 ${ride.status === RideStatus.ACCEPTED ? 'cursor-pointer hover:bg-white/10 active:scale-[0.98]' : ''}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/10 relative">
                <i className={`fa-solid ${
                    ride.category === 'Moto' ? 'fa-motorcycle' :
                    ride.category === 'Carro' ? 'fa-car-side' : 'fa-truck-pickup'
                } text-xl`}></i>
                {ride.status === RideStatus.ACCEPTED && (
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] animate-bounce shadow-lg">
                      <i className="fa-solid fa-comment-dots"></i>
                   </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-[11px] text-blue-300 uppercase tracking-widest">OS {ride.osNumber}</span>
                  <span className="text-[10px] text-white/30 font-bold">{formatTime(ride.createdAt)}</span>
                </div>
                <div className="text-white font-black text-sm truncate uppercase tracking-tight">
                  {ride.passengerName}
                </div>
                <div className="flex items-center gap-1 text-white/40 text-[10px] truncate mt-1 font-medium">
                  <i className="fa-solid fa-location-dot text-[8px]"></i>
                  <span className="truncate">{ride.destination}</span>
                </div>
                
                {ride.status === RideStatus.ACCEPTED && ride.distanceKm !== undefined && (
                   <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${Math.max(10, 100 - (ride.distanceKm * 20))}%` }}
                         ></div>
                      </div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {ride.distanceKm.toFixed(1)} km
                      </span>
                   </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-xl ${
                  ride.status === RideStatus.ACCEPTED ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {ride.status}
                </div>
                {ride.status === RideStatus.ACCEPTED && (
                  <div className="mt-2 text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">Clique para conversar</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RideList;
