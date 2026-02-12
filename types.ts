
export enum RideStatus {
  WAITING = 'Aguardando motorista',
  ACCEPTED = 'Aceita',
  FINISHED = 'Finalizada'
}

export enum RideCategory {
  MOTO = 'Moto',
  CARRO = 'Carro',
  SUV = 'SUV'
}

export interface DriverInfo {
  name: string;
  photo: string;
  rating: number;
  vehicle: string;
  plate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'passenger' | 'driver';
  text: string;
  timestamp: number;
}

export interface RideRequest {
  id: string;
  osNumber: string;
  passengerName: string;
  passengerCpf: string;
  passengerWhatsapp: string;
  destination: string;
  category: RideCategory;
  status: RideStatus;
  driverName?: string;
  driverInfo?: DriverInfo;
  distanceKm?: number;
  messages?: ChatMessage[];
  createdAt: number;
}

export interface LocationSuggestion {
  title: string;
  address: string;
}
