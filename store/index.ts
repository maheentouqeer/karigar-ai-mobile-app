import { create } from 'zustand';
import { Booking, Provider, User } from '../types';

interface AppState {
  user: User | null;
  bookings: Booking[];
  agentTrace: any[];
  setBookings: (bookings: Booking[]) => void;
  addAgentTrace: (trace: any) => void;
}

export const useStore = create<AppState>((set) => ({
  user: { id: '1', name: 'Customer' },
  bookings: [],
  agentTrace: [],
  setBookings: (bookings) => set({ bookings }),
  addAgentTrace: (trace) => set((state) => ({ agentTrace: [...state.agentTrace, trace] })),
}));
