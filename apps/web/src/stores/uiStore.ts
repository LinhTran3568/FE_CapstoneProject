import { create } from 'zustand';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  simulateBotState: 'ALLOWED' | 'THROTTLED' | 'BLOCKED';
  setSimulateBotState: (state: 'ALLOWED' | 'THROTTLED' | 'BLOCKED') => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  simulateBotState: 'ALLOWED',
  setSimulateBotState: (simulateBotState) => set({ simulateBotState }),
}));
