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

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    if (toastTimer) clearTimeout(toastTimer);
    const id = `toast-${Date.now()}`;
    // Show only the latest toast, instantly replacing the previous one
    set({ toasts: [{ id, message, type }] });
    toastTimer = setTimeout(() => {
      set({ toasts: [] });
    }, 2800);
  },
  removeToast: (id) => {
    if (toastTimer) clearTimeout(toastTimer);
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  simulateBotState: 'ALLOWED',
  setSimulateBotState: (simulateBotState) => set({ simulateBotState }),
}));
