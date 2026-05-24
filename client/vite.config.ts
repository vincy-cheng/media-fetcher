import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: mode === 'web' ? 5173 : 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    ...(mode === 'web'
      ? { proxy: { '/api': 'http://localhost:3001' } }
      : {}),
  },
}))
