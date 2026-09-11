import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { useUIStore } from './stores/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`p-4 rounded-xl border text-xs font-semibold shadow-2xl flex items-center justify-between cursor-pointer animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
              : toast.type === 'error'
              ? 'bg-red-950 border-red-500/50 text-red-400'
              : toast.type === 'warning'
              ? 'bg-amber-950 border-amber-500/50 text-amber-400'
              : 'bg-navy-800 border-cyan-500/50 text-cyan-400'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col w-full bg-[#060b18] text-slate-100 selection:bg-orange-500 selection:text-white">
          <Navbar />
          <main className="flex-1 w-full pt-16">
            <AppRoutes />
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
