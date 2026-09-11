import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface GlobalErrorState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, GlobalErrorState> {
  public state: GlobalErrorState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): GlobalErrorState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070A] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-2xl">
            !
          </div>
          <h1 className="text-2xl font-bold font-display">App Initialization Error</h1>
          <p className="text-sm text-[#A3A8B3] max-w-md">
            {this.state.error?.message || 'A system error occurred during rendering.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-[#FF5A36] text-white font-bold text-xs shadow-lg shadow-[#FF5A36]/30"
          >
            Reload Page (F5)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`p-4 rounded-2xl border text-xs font-semibold shadow-2xl flex items-center justify-between cursor-pointer animate-fadeIn font-display ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
              : toast.type === 'error'
              ? 'bg-red-950 border-red-500/50 text-red-400'
              : toast.type === 'warning'
              ? 'bg-amber-950 border-amber-500/50 text-amber-400'
              : 'bg-[#0A0D12] border-white/20 text-[#F5F5F2]'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auth pages handle their own full-bleed layout (no header/footer overlap)
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#05070A] text-[#F5F5F2] selection:bg-[#FF5A36] selection:text-white font-sans antialiased">
      {!isAuthPage && <Navbar />}
      <main className="flex-1 w-full">
        <AppRoutes />
      </main>
      {!isAuthPage && <Footer />}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
