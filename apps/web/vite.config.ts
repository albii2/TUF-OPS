import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  base: '/',
  plugins: [react(), svgr()],
  define: {
    __TUF_VERSION__: JSON.stringify(process.env.VITE_GIT_COMMIT?.slice(0, 7) || 'dev'),
    __TUF_COMMIT__: JSON.stringify(process.env.VITE_GIT_COMMIT?.slice(0, 7) || 'dev'),
  },
})
