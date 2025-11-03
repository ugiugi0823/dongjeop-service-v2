import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/dongjeop-service-v2/' : '/',
  server: {
    port: 7777,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/gt.jsonl': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/review_queue_images.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/photo_collection_images.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})

