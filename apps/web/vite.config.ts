import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'

  return {
    base: '/',
    plugins: [react(), svgr()],
    define: {
      __TUF_VERSION__: JSON.stringify(commit),
      __TUF_COMMIT__: JSON.stringify(commit),
    },
  }
})
