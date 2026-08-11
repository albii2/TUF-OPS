import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function getVersion(): string {
  try {
    const version = readFileSync(resolve(__dirname, '../../VERSION'), 'utf-8').trim()
    if (version) return version
  } catch {}
  return 'dev'
}

export default defineConfig({
  base: '/',
  plugins: [react(), svgr()],
  define: {
    __TUF_VERSION__: JSON.stringify(getVersion()),
    __TUF_COMMIT__: JSON.stringify(getVersion()),
  },
})
