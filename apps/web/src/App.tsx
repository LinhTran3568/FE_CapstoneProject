import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Navbar as AppNavbar } from './components/layout/Navbar';
import { Navbar as LandingNavbar } from './components/landing/Navbar';
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
    <div className="fixed top-24 right-6 z-[100] w-full max-w-sm space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-5 py-4 rounded-2xl border backdrop-blur-xl text-sm font-semibold shadow-2xl flex items-center justify-between gap-3 font-display transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 shadow-emerald-500/25'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-rose-500/25'
              : toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/60 text-amber-200 shadow-amber-500/25'
              : 'bg-[#0A0D12]/95 border-[#FF5A36]/60 text-[#F5F5F2] shadow-[#FF5A36]/25'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {(!toast.type || toast.type === 'info') && <Info className="w-5 h-5 text-[#FF5A36] shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white leading-snug">{toast.message}</span>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
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

  // Auto scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Auth pages handle their own full-bleed layout (no header/footer overlap)
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  );
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#05070A] text-[#F5F5F2] selection:bg-[#FF5A36] selection:text-white font-sans antialiased">
      {!isAuthPage && (isLandingPage ? <LandingNavbar /> : <AppNavbar />)}
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
