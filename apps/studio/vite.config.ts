import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  root: resolve(process.cwd(), 'apps/studio'),
  server: {
    fs: {
      allow: [resolve(process.cwd())]
    }
  }
})

