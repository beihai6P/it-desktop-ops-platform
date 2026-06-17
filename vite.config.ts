import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

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
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
          console.log('[Vite Proxy] 请求:', req.method, req.url);
        },
        onError: (err, req, res) => {
          console.error('[Vite Proxy] 错误:', err);
        }
      },
    },
  },
})
