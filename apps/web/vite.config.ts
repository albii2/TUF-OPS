import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { execSync } from 'child_process'

const GIT_COMMIT = execSync('git rev-parse --short HEAD').toString().trim()
const GIT_DATE = execSync('git log -1 --format=%ci').toString().trim()

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), svgr()],
  define: {
    __TUF_VERSION__: JSON.stringify(`${GIT_COMMIT} (${GIT_DATE})`),
    __TUF_COMMIT__: JSON.stringify(GIT_COMMIT),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
