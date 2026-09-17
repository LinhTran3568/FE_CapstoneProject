import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load .env file vars for current mode
  const env = loadEnv(mode, process.cwd(), '');

  // Merge process.env (Doppler injected) with .env file vars
  // process.env takes priority so Doppler values override local .env
  const viteEnvVars: Record<string, string> = {};
  const allEnv = { ...env, ...process.env };
  for (const key of Object.keys(allEnv)) {
    if (key.startsWith('VITE_')) {
      viteEnvVars[`import.meta.env.${key}`] = JSON.stringify(allEnv[key]);
    }
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
