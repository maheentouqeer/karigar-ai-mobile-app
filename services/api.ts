import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.karigar.ai',
  timeout: 10000,
});

export const fetchProviders = async (serviceName: string) => {
  // Mock API call
  return { data: [] };
};

export const createBooking = async (data: any) => {
  return { status: 'success', data };
};

export default api;
