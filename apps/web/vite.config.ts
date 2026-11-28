import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load .env file vars for current mode
  const env = loadEnv(mode, process.cwd(), '');
  // Mobile and web use the same Google OAuth Web client in local development.
  // Load the mobile app's public config as a fallback so a missing web-only
  // VITE_GOOGLE_CLIENT_ID never produces a Google request without client_id.
  const mobileEnv = loadEnv(mode, path.resolve(__dirname, '../mobile'), '');

  // Merge process.env (Doppler injected) with .env file vars
  // process.env takes priority so Doppler values override local .env
  const viteEnvVars: Record<string, string> = {};
  const allEnv = { ...mobileEnv, ...env, ...process.env };
  for (const key of Object.keys(allEnv)) {
    if (key.startsWith('VITE_')) {
      viteEnvVars[`import.meta.env.${key}`] = JSON.stringify(allEnv[key]);
      viteEnvVars[`process.env.${key}`] = JSON.stringify(allEnv[key]);
    }
  }

  const googleClientId = allEnv.VITE_GOOGLE_CLIENT_ID || allEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (googleClientId) {
    viteEnvVars['import.meta.env.VITE_GOOGLE_CLIENT_ID'] = JSON.stringify(googleClientId);
  }

  return {
    plugins: [react()],
    define: viteEnvVars,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
