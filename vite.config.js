import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Import the new plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Add it here
  ],
  server: {
    port: 3001, // Force it to run on port 3001
  }
})
