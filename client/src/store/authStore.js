import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('prepwise_token'),
  loading: true,

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    const token = localStorage.getItem('prepwise_token');
    if (!token) {
      set({ user: null, token: null, loading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem('prepwise_token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('prepwise_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('prepwise_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  googleAuth: async (googleData) => {
    const { data } = await api.post('/auth/google', googleData);
    localStorage.setItem('prepwise_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  logout: () => {
    localStorage.removeItem('prepwise_token');
    set({ user: null, token: null });
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/users/profile', updates);
    set({ user: data.user });
    return data;
  },
}));
