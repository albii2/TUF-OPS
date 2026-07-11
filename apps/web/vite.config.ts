import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { execSync } from 'child_process'

function getCommit() {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'dev' }
}

export default defineConfig({
  base: '/',
  plugins: [react(), svgr()],
  define: {
    __TUF_VERSION__: JSON.stringify(getCommit()),
    __TUF_COMMIT__: JSON.stringify(getCommit()),
  },
})
