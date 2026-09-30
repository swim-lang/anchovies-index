import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps the build portable (any folder, any host, file previews).
export default defineConfig({
  base: './',
  plugins: [react()],
})
