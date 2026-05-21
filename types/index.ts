export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Provider {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  distance: number;
  baseRate: number;
  trustScore: number;
  avatar?: string;
  tags?: string[];
  verified: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  date: string;
  time: string;
  status: 'PENDING' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  price: number;
}
