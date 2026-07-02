import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/papers': 'http://127.0.0.1:8000',
      '/upload': 'http://127.0.0.1:8000',
      '/chat': 'http://127.0.0.1:8000',
      '/contradictions': 'http://127.0.0.1:8000',
      '/claims': 'http://127.0.0.1:8000',
      '/timeline': 'http://127.0.0.1:8000',
      '/graph': 'http://127.0.0.1:8000',
      '/export': 'http://127.0.0.1:8000',
    }
  }
})
