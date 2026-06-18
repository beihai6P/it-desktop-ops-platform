import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import type { IncomingMessage } from 'http';
import type { Proxy } from 'http-proxy';

const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:5000';

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy: Proxy) => {
          proxy.on('proxyReq', (proxyReq: ReturnType<Proxy['on']>, req: IncomingMessage) => {
            console.log('[Vite Proxy] 请求:', req.method, req.url);
          });
          proxy.on('error', (err: Error) => {
            console.error('[Vite Proxy] 错误:', err);
          });
        }
      },
    },
  },
})
