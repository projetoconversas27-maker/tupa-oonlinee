
import React, { useState, useEffect, useRef } from 'react';
import { RideCategory, LocationSuggestion, DriverInfo } from '../types';
import { maskCpf, maskPhone, validateCpf } from '../utils/formatters';
import { getLocationSuggestions, getAddressFromCoords } from '../services/geminiService';
import MapPicker from './MapPicker';
import VirtualKeyboard from './VirtualKeyboard';

interface RideFormProps {
  onSubmit: (data: {
    destination: string;
    passengerName: string;
    passengerCpf: string;
    passengerWhatsapp: string;
    category: RideCategory;
    driverInfo?: DriverInfo;
  }) => void;
  onOpenHistory: () => void;
}

enum FormStep {
  DESTINATION = 1,
  PASSENGER = 2,
  CATEGORY = 3,
  SUMMARY = 4,
  SEARCHING = 5,
  CONFIRMED = 6
}

const MOCK_DRIVERS: DriverInfo[] = [
  { name: "Ricardo Silva", photo: "https://i.pravatar.cc/150?u=ricardo", rating: 4.9, vehicle: "Toyota Corolla Prata", plate: "BRA-2E19" },
  { name: "Maria Santos", photo: "https://i.pravatar.cc/150?u=maria", rating: 4.8, vehicle: "Hyundai HB20 Branco", plate: "KGP-4412" },
  { name: "André Lima", photo: "https://i.pravatar.cc/150?u=andre", rating: 5.0, vehicle: "Honda Civic Preto", plate: "RTX-9J21" },
  { name: "Carla Dias", photo: "https://i.pravatar.cc/150?u=carla", rating: 4.7, vehicle: "VW Polo Azul", plate: "NFX-3388" }
];

const RideForm: React.FC<RideFormProps> = ({ onSubmit, onOpenHistory }) => {
  const [step, setStep] = useState<FormStep>(FormStep.DESTINATION);
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Minha Localização Atual');
  const [passengerName, setPassengerName] = useState('');
  const [passengerCpf, setPassengerCpf] = useState('');
  const [passengerWhatsapp, setPassengerWhatsapp] = useState('');
  const [category, setCategory] = useState<RideCategory>(RideCategory.CARRO);
  const [foundDriver, setFoundDriver] = useState<DriverInfo | null>(null);
  const [ridePrice, setRidePrice] = useState(0);
  
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [activeKeyboard, setActiveKeyboard] = useState<'destination' | 'name' | 'cpf' | 'whatsapp' | null>(null);
  const [cpfError, setCpfError] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  const searchTimeout = useRef<any>(null);
  const summaryMapRef = useRef<any>(null);
  const summaryContainerRef = useRef<HTMLDivElement>(null);

  // Efeito de digitação para o placeholder
  useEffect(() => {
    const fullText = "Digite o destino";
    let index = 0;
    let isDeleting = false;
    let timer: any;

    const animate = () => {
      const current = isDeleting 
        ? fullText.substring(0, index - 1) 
        : fullText.substring(0, index + 1);
      
      setAnimatedPlaceholder(current + (index === fullText.length && !isDeleting ? "" : "|"));
      index = isDeleting ? index - 1 : index + 1;

      let speed = isDeleting ? 100 : 150;

      if (!isDeleting && index === fullText.length) {
        isDeleting = true;
        speed = 4000; 
      } else if (isDeleting && index === 0) {
        isDeleting = false;
        speed = 500; 
      }

      timer = setTimeout(animate, speed);
    };

    timer = setTimeout(animate, 500);
    return () => clearTimeout(timer);
  }, []);

  // Geolocation inicial
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPickupCoords(coords);
          getAddressFromCoords(coords.lat, coords.lng).then(setPickupLocation);
        },
        null,
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Mapa de resumo - Renderiza a rota visual estilo Google Maps
  useEffect(() => {
    if (step === FormStep.SUMMARY && pickupCoords && destCoords && summaryContainerRef.current) {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      if (summaryMapRef.current) {
        summaryMapRef.current.remove();
      }

      const map = L.map(summaryContainerRef.current, {
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: false,
        touchZoom: true,
        doubleClickZoom: false,
        attributionControl: false
      });

      // Layer estilo Uber/Google Maps
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

      // Ícones personalizados para partida e destino
      const pickupIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500/20 rounded-full animate-pulse"></div>
            <div class="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg relative z-10"></div>
          </div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const destIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <i class="fa-solid fa-location-dot text-2xl text-black drop-shadow-md"></i>
            <div class="w-2 h-1 bg-black/20 rounded-full blur-[1px] -mt-1"></div>
          </div>
        `,
        className: '',
        iconSize: [24, 32],
        iconAnchor: [12, 30]
      });

      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).addTo(map);
      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon }).addTo(map);

      // Linha de rota "Navegação" (Google Maps Style)
      // Desenha uma sombra/borda para a linha
      L.polyline([
        [pickupCoords.lat, pickupCoords.lng],
        [destCoords.lat, destCoords.lng]
      ], { 
        color: '#1e3a8a', 
        weight: 10, 
        opacity: 0.15 
      }).addTo(map);

      // Linha principal azul vibrante
      const line = L.polyline([
        [pickupCoords.lat, pickupCoords.lng],
        [destCoords.lat, destCoords.lng]
      ], { 
        color: '#3b82f6', 
        weight: 6, 
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Ajusta o zoom "de longe" para mostrar ambos os pontos
      map.fitBounds(line.getBounds(), { padding: [50, 50] });
      summaryMapRef.current = map;
    }
  }, [step, pickupCoords, destCoords]);

  useEffect(() => {
    if (destination.length >= 2 && !isSearching && !isReverseGeocoding && step === FormStep.DESTINATION && activeKeyboard === 'destination') {
       if (searchTimeout.current) clearTimeout(searchTimeout.current);
       searchTimeout.current = setTimeout(async () => {
          setIsSearching(true);
          const results = await getLocationSuggestions(destination, pickupCoords || undefined);
          setSuggestions(results);
          setIsSearching(false);
          setShowSuggestions(results.length > 0 && activeKeyboard === 'destination');
       }, 300);
    } else if (destination.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [destination, pickupCoords, step, activeKeyboard]);

  useEffect(() => {
    if (step === FormStep.SUMMARY) {
      const base = 15 + Math.random() * 20;
      const multiplier = category === RideCategory.SUV ? 1.5 : category === RideCategory.MOTO ? 0.7 : 1;
      setRidePrice(base * multiplier);
    }
  }, [step, category]);

  const nextStep = () => {
    if (step === FormStep.PASSENGER) {
      if (!validateCpf(passengerCpf)) {
        setCpfError(true);
        setTimeout(() => setCpfError(false), 3000);
        return;
      }
    }
    
    setActiveKeyboard(null);
    setShowSuggestions(false);
    if (step === FormStep.DESTINATION && !destination) return;
    if (step === FormStep.PASSENGER && (!passengerName || passengerCpf.length < 14 || passengerWhatsapp.length < 14)) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setActiveKeyboard(null);
    setShowSuggestions(false);
    setStep(prev => prev - 1);
  };

  const startRequestProcess = () => {
    setStep(FormStep.SEARCHING);
    setTimeout(() => {
      const driver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
      setFoundDriver(driver);
      setStep(FormStep.CONFIRMED);
      onSubmit({ 
        destination, 
        passengerName, 
        passengerCpf, 
        passengerWhatsapp, 
        category,
        driverInfo: driver
      });
    }, 5000);
  };

  const handleFinish = () => {
    setStep(FormStep.DESTINATION);
    setDestination('');
    setPassengerName('');
    setPassengerCpf('');
    setPassengerWhatsapp('');
    setCategory(RideCategory.CARRO);
    setFoundDriver(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveKeyboard(null);
    setDestCoords(null);
  };

  const handleSelectSuggestion = (s: LocationSuggestion) => {
    setDestination(`${s.title} - ${s.address}`);
    // Simula um destino em coordenadas reais baseado na sugestão para o mapa de resumo
    if (pickupCoords) {
      setDestCoords({
        lat: pickupCoords.lat + (Math.random() - 0.5) * 0.04,
        lng: pickupCoords.lng + (Math.random() - 0.5) * 0.04
      });
    }
    setShowSuggestions(false);
    setActiveKeyboard(null);
    setTimeout(() => setStep(FormStep.PASSENGER), 200);
  };

  const handleKeyboardInput = (key: string) => {
    if (activeKeyboard === 'destination') setDestination(prev => prev + key);
    if (activeKeyboard === 'name') setPassengerName(prev => prev + key);
    if (activeKeyboard === 'cpf') {
        setCpfError(false);
        setPassengerCpf(prev => maskCpf(prev + key));
    }
    if (activeKeyboard === 'whatsapp') setPassengerWhatsapp(prev => maskPhone(prev + key));
  };

  const handleKeyboardBackspace = () => {
    if (activeKeyboard === 'destination') setDestination(prev => prev.slice(0, -1));
    if (activeKeyboard === 'name') setPassengerName(prev => prev.slice(0, -1));
    if (activeKeyboard === 'cpf') {
        setCpfError(false);
        setPassengerCpf(prev => maskCpf(prev.replace(/\D/g, '').slice(0, -1)));
    }
    if (activeKeyboard === 'whatsapp') setPassengerWhatsapp(prev => maskPhone(prev.replace(/\D/g, '').slice(0, -1)));
  };

  const handleKeyboardClear = () => {
    if (activeKeyboard === 'destination') {
      setDestination('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (activeKeyboard === 'name') setPassengerName('');
    if (activeKeyboard === 'cpf') {
        setCpfError(false);
        setPassengerCpf('');
    }
    if (activeKeyboard === 'whatsapp') setPassengerWhatsapp('');
  };

  const renderProgress = () => {
    if (step >= FormStep.SEARCHING) return null;
    return (
      <div className="flex items-center justify-between mb-8 px-6 relative shrink-0">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-100 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-[1.5px] bg-blue-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s} 
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500 ${
              step >= s ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' : 'bg-white border border-gray-100 text-gray-300'
            }`}
          >
            {step > s ? <i className="fa-solid fa-check"></i> : s}
            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${
              step === s ? 'text-blue-600' : 'text-gray-300'
            }`}>
              {s === 1 ? 'Rota' : s === 2 ? 'Dados' : s === 3 ? 'Veículo' : 'Revisão'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={`bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-lg mx-auto overflow-hidden relative min-h-[580px] flex flex-col border border-gray-50 transition-all duration-500 ${activeKeyboard ? '-translate-y-24 scale-95 opacity-80' : ''}`}>
        {renderProgress()}

        <div className="flex-1 flex flex-col pt-2 min-h-0">
          
          {step === FormStep.DESTINATION && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Para onde vamos <br/>hoje?</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium italic">Encontre o seu destino ideal.</p>
              </div>

              <div className="relative flex-1">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 opacity-50 group-focus-within:opacity-100 transition-opacity">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={destination}
                    onFocus={() => {
                      setActiveKeyboard('destination');
                      if (destination.length >= 2) setShowSuggestions(true);
                    }}
                    placeholder={animatedPlaceholder}
                    className="w-full pl-12 pr-14 py-5 text-base border border-gray-100 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all bg-gray-50/30 placeholder:text-gray-400 font-bold cursor-pointer"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveKeyboard(null);
                        setShowMap(true);
                      }}
                      className="mr-2 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-blue-600 shadow-lg transition-all active:scale-90"
                    >
                      <i className="fa-solid fa-map"></i>
                    </button>
                    <div className="absolute top-14 right-2 w-32 bg-blue-600 text-white p-2 rounded-lg shadow-xl animate-bounce z-50">
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-blue-600 rotate-45"></div>
                      <p className="text-[10px] font-black leading-tight text-center uppercase">marque no mapa o destino</p>
                    </div>
                  </div>
                </div>
                
                {showSuggestions && suggestions.length > 0 && activeKeyboard === 'destination' && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-50 mt-2 rounded-[1.5rem] shadow-[0_15px_30px_rgba(0,0,0,0.1)] max-h-[220px] overflow-y-auto animate-in zoom-in-95 duration-200 divide-y divide-gray-50">
                    {suggestions.map((s, idx) => (
                      <li 
                        key={idx}
                        onClick={() => handleSelectSuggestion(s)}
                        className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center text-sm shrink-0">
                          <i className="fa-solid fa-map-pin"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-gray-800 truncate">{s.title}</div>
                          <div className="text-[11px] text-gray-400 truncate">{s.address}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-auto pt-8 space-y-4">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!destination || destination.length < 3}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-50 disabled:text-gray-300 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_20px_rgba(37,99,235,0.2)] group"
                >
                  PRÓXIMO PASSO
                  <i className="fa-solid fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </button>

                <div className="flex justify-center">
                  <button 
                    onClick={onOpenHistory}
                    className="w-full bg-white text-blue-600 border border-blue-50 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group active:scale-95 shadow-md hover:bg-blue-50/50"
                  >
                    <i className="fa-solid fa-clock-rotate-left text-lg group-hover:rotate-[-45deg] transition-transform"></i>
                    <span className="text-sm font-black uppercase tracking-[0.2em]">Histórico</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === FormStep.PASSENGER && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quem é você?</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">Dados necessários para sua segurança.</p>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-gray-400 text-[9px] font-black mb-1.5 uppercase tracking-[0.2em] group-focus-within:text-blue-600 transition-colors">Nome Completo</label>
                  <input
                    type="text"
                    readOnly
                    value={passengerName}
                    onFocus={() => setActiveKeyboard('name')}
                    placeholder="Seu nome"
                    className="w-full p-4 border border-gray-100 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 bg-gray-50/30 text-base font-semibold transition-all cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="group relative">
                    <label className={`block text-[9px] font-black mb-1.5 uppercase tracking-[0.2em] transition-colors ${cpfError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-600'}`}>
                      CPF {cpfError && <span className="ml-2 animate-pulse">(INVÁLIDO)</span>}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={passengerCpf}
                      onFocus={() => setActiveKeyboard('cpf')}
                      placeholder="000.000.000-00"
                      className={`w-full p-4 border rounded-2xl focus:outline-none transition-all cursor-pointer text-sm font-mono ${
                        cpfError 
                        ? 'border-red-500 bg-red-50 text-red-600 ring-4 ring-red-100 animate-shake animate-blink-red' 
                        : 'border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 bg-gray-50/30'
                      }`}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-gray-400 text-[9px] font-black mb-1.5 uppercase tracking-[0.2em] group-focus-within:text-emerald-600 transition-colors">WhatsApp</label>
                    <input
                      type="text"
                      readOnly
                      value={passengerWhatsapp}
                      onFocus={() => setActiveKeyboard('whatsapp')}
                      placeholder="(00) 00000-0000"
                      className="w-full p-4 border border-gray-100 rounded-2xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 bg-gray-50/30 text-sm font-mono transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 grid grid-cols-12 gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-4 py-5 border border-gray-100 text-gray-400 rounded-2xl font-black text-xs hover:bg-gray-50 transition-all uppercase tracking-widest active:scale-95"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!passengerName || passengerCpf.length < 14 || passengerWhatsapp.length < 14}
                  className="col-span-8 py-5 bg-black text-white rounded-2xl font-black text-xs hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all shadow-xl uppercase tracking-widest active:scale-95"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === FormStep.CATEGORY && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Qual o veículo?</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">Escolha a categoria que melhor te atende.</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {Object.values(RideCategory).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all duration-300 group ${
                      category === cat 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                      : 'border-gray-50 hover:border-blue-100 text-gray-400 bg-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-500 ${
                      category === cat ? 'bg-blue-600 text-white rotate-3 scale-110 shadow-lg' : 'bg-gray-50 text-gray-400'
                    }`}>
                      <i className={`fa-solid ${
                        cat === RideCategory.MOTO ? 'fa-motorcycle' :
                        cat === RideCategory.CARRO ? 'fa-car-side' : 'fa-truck-pickup'
                      }`}></i>
                    </div>
                    <div className="ml-4 text-left">
                      <p className="font-black text-sm uppercase tracking-tight leading-none mb-1">{cat}</p>
                      <p className="text-[10px] font-medium opacity-60">
                        {cat === 'Moto' ? 'Agilidade Urbana' : 
                         cat === 'Carro' ? 'Conforto & Praticidade' : 'Máximo Espaço & Segurança'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-12 gap-4 shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-4 py-5 border border-gray-100 text-gray-400 rounded-2xl font-black text-xs hover:bg-gray-50 transition-all uppercase tracking-widest active:scale-95"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="col-span-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl uppercase tracking-[0.1em] flex items-center justify-center gap-3 active:scale-95"
                >
                  REVISAR PEDIDO
                  <i className="fa-solid fa-list-check"></i>
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SUMMARY && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Resumo da Corrida</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">Confirme os detalhes antes de chamar.</p>
              </div>

              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                {/* Mapa Real de Rota com Linha de Navegação */}
                <div className="bg-gray-100 rounded-3xl h-44 relative overflow-hidden border border-gray-200 shadow-inner">
                  <div ref={summaryContainerRef} className="w-full h-full" />
                  <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-md flex items-center gap-2 pointer-events-none">
                     <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                     <span className="text-[9px] font-black uppercase text-gray-700 tracking-widest">Trajeto Optimizado</span>
                  </div>
                </div>

                {/* Detalhes de Endereço */}
                <div className="space-y-3 px-2">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shrink-0 mt-1">
                      <i className="fa-solid fa-circle"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Partida</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 mt-1">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destino</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{destination}</p>
                    </div>
                  </div>
                </div>

                {/* Valor e Categoria */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor Estimado</p>
                    <p className="text-xl font-black text-emerald-700 tracking-tighter">R$ {ridePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                       <i className={`fa-solid ${
                          category === RideCategory.MOTO ? 'fa-motorcycle' :
                          category === RideCategory.CARRO ? 'fa-car-side' : 'fa-truck-pickup'
                        } text-gray-400`}></i>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Veículo</p>
                      <p className="text-xs font-black text-gray-800 uppercase">{category}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-12 gap-4 shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-4 py-5 border border-gray-100 text-gray-400 rounded-2xl font-black text-xs hover:bg-gray-50 transition-all uppercase tracking-widest active:scale-95"
                >
                  Ajustar
                </button>
                <button
                  onClick={startRequestProcess}
                  className="col-span-8 py-5 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition-all shadow-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 group"
                >
                  CHAMAR MOTORISTA
                  <i className="fa-solid fa-paper-plane text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SEARCHING && (
            <div className="animate-in fade-in duration-500 flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="relative w-40 h-40 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-4 rounded-full border-4 border-gray-50 border-t-emerald-400 animate-spin [animation-duration:2s]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <i className={`fa-solid ${category === 'Moto' ? 'fa-motorcycle' : 'fa-car'} text-4xl text-blue-600 animate-pulse`}></i>
                </div>
                <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20"></div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Buscando Motorista</h2>
              <p className="text-gray-400 font-medium text-sm">Localizando o parceiro mais próximo...</p>
              <div className="mt-12 w-full max-w-xs bg-gray-50 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-[progress_5s_linear_infinite]"></div>
              </div>
            </div>
          )}

          {step === FormStep.CONFIRMED && foundDriver && (
            <div className="animate-in zoom-in-95 fade-in duration-700 flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 scale-110 shadow-lg">
                   <i className="fa-solid fa-check text-4xl text-emerald-600"></i>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Motorista Encontrado!</h2>
                <p className="text-sm text-gray-400 font-medium mb-8">Sua corrida foi aceita com sucesso.</p>

                <div className="w-full bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-6 flex flex-col items-center">
                  <div className="relative mb-4">
                    <img src={foundDriver.photo} alt={foundDriver.name} className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white" />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                      <i className="fa-solid fa-star"></i> {foundDriver.rating}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-1 uppercase tracking-tight">{foundDriver.name}</h3>
                  <p className="text-xs text-gray-400 font-bold mb-4">{foundDriver.vehicle} • <span className="text-blue-600">{foundDriver.plate}</span></p>
                  <div className="w-full border-t border-gray-200 pt-4 mt-2">
                    <div className="flex items-center justify-center gap-3 text-emerald-600 bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-100">
                      <i className="fa-brands fa-whatsapp text-xl"></i>
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase leading-none mb-1">Todas as informações da corrida enviada para seu whatsapp</p>
                        <p className="text-sm font-mono font-bold leading-none">{passengerWhatsapp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleFinish} className="w-full bg-black text-white font-black py-5 rounded-2xl text-sm transition-all active:scale-95 shadow-xl uppercase tracking-widest mt-auto">Nova Solicitação</button>
            </div>
          )}
        </div>
      </div>

      {activeKeyboard && (
        <VirtualKeyboard 
          layout={(activeKeyboard === 'cpf' || activeKeyboard === 'whatsapp') ? 'numeric' : 'alphanumeric'}
          onKeyPress={handleKeyboardInput}
          onBackspace={handleKeyboardBackspace}
          onClear={handleKeyboardClear}
          onClose={() => {
            setActiveKeyboard(null);
            setShowSuggestions(false);
          }}
        />
      )}

      {showMap && <MapPicker onConfirm={(lat, lng) => { 
        setShowMap(false); 
        setIsReverseGeocoding(true);
        setDestination('Detectando local...');
        setDestCoords({ lat, lng });
        getAddressFromCoords(lat, lng).then(addr => {
          setDestination(addr);
          setIsReverseGeocoding(false);
          setShowSuggestions(false);
          setStep(FormStep.PASSENGER); 
        }); 
      }} onCancel={() => setShowMap(false)} />}
    </>
  );
};

export default RideForm;
