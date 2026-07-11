import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), svgr()],
  define: {
    __TUF_VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'),
    __TUF_COMMIT__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'),
  },
})
