
import React, { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onConfirm, onCancel }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centro padrão (São Paulo) caso o GPS falhe
    let center: [number, number] = [-23.5505, -46.6333];

    const initMap = (coords: [number, number]) => {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      // Inicializa o mapa com zoom apropriado
      const map = L.map(mapContainerRef.current, {
        zoomControl: false // Removemos para um visual mais limpo, podemos adicionar se quiser
      }).setView(coords, 16);
      
      // Tiles do CartoDB Positron - Visual cinza/minimalista estilo Uber
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Adiciona o controle de zoom em uma posição mais discreta
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setLoadingLocation(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          center = [pos.coords.latitude, pos.coords.longitude];
          initMap(center);
        },
        () => {
          initMap(center); // Fallback
        },
        { enableHighAccuracy: true }
      );
    } else {
      initMap(center);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleConfirm = () => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      onConfirm(center.lat, center.lng);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4">
      <div className="bg-white w-full max-w-4xl h-full md:h-[85vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Defina o destino</h3>
            <p className="text-sm text-gray-500 font-medium">Mova o mapa para posicionar o pino</p>
          </div>
          <button 
            onClick={onCancel}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        {/* Área do Mapa */}
        <div className="flex-1 relative bg-[#f0f0f0]">
          {loadingLocation && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-50/90">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">Localizando...</span>
              </div>
            </div>
          )}
          
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Pino Central Fixo (Estilo Uber) */}
          <div className="map-pin-center pointer-events-none">
            <div className="relative flex flex-col items-center">
              {/* Balão de destino */}
              <div className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded mb-1 uppercase tracking-tighter whitespace-nowrap">
                Destino
              </div>
              <i className="fa-solid fa-location-dot text-4xl text-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)]"></i>
              {/* Sombra no chão */}
              <div className="w-2 h-1 bg-black/20 rounded-full blur-[1px] mt-[-2px]"></div>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row gap-4">
          <button
            onClick={onCancel}
            className="hidden md:block flex-1 py-4 px-6 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-5 px-6 bg-black hover:bg-gray-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            <i className="fa-solid fa-check-circle"></i>
            Confirmar este local
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
