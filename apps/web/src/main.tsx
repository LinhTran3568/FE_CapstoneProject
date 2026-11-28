import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// The shared API client is also used by React Native, so it resolves its
// configuration from a runtime environment object. Expose Vite's build-time
// variables before any component or API module makes its first request.
(window as Window & { __ENV__?: Record<string, unknown> }).__ENV__ = {
  ...(window as Window & { __ENV__?: Record<string, unknown> }).__ENV__,
  ...import.meta.env,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
