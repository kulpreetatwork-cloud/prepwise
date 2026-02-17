import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('prepwise_theme') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('prepwise_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
}));
