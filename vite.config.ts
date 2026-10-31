import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/GestioneAppalti/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Librerie di terze parti in file separati: cambiano raramente e
        // restano in cache del browser tra un rilascio e l'altro.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (id.includes('node_modules/@supabase/')) return 'vendor-supabase'
          if (id.includes('node_modules/lucide-react/')) return 'vendor-icons'
          return undefined
        },
      },
    },
  },
})
