import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { refusalReasonForSupabaseKey, SUPABASE_ADMIN_KEY_MESSAGE } from './src/supabaseKeyGuard.js'

// Stop an admin key from being written into the dev server or the production bundle.
function rejectSupabaseAdminKey() {
  return {
    name: 'reject-supabase-admin-key',
    config(_userConfig, { mode, command }) {
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      const reason = refusalReasonForSupabaseKey(env.VITE_SUPABASE_KEY || '')
      if (!reason) return null

      if (command === 'build') {
        throw new Error(SUPABASE_ADMIN_KEY_MESSAGE)
      }

      // Dev server: blank the key before it is sent to the browser and flag the UI.
      return {
        define: {
          'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(''),
          'import.meta.env.VITE_SUPABASE_KEY_REFUSED': JSON.stringify('1'),
        },
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [rejectSupabaseAdminKey(), react()],
})
