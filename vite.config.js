import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  // Load ALL env vars (including server-only ones without VITE_ prefix)
  const env = loadEnv(mode, process.cwd(), '')

  // Build the n8n proxy — reads N8N_WEBHOOK_TARGET from .env.local
  // e.g. N8N_WEBHOOK_TARGET=https://your-n8n.app.n8n.cloud/webhook-test/publish-posts
  const n8nProxy = {}
  if (env.N8N_WEBHOOK_TARGET) {
    try {
      const u = new URL(env.N8N_WEBHOOK_TARGET)
      n8nProxy['/api/n8n-publish'] = {
        target: `${u.protocol}//${u.host}`,
        changeOrigin: true,
        rewrite: () => u.pathname,
        headers: {
          // Cloudflare Access Service Token — bypasses the Zero Trust auth wall
          ...(env.CF_ACCESS_CLIENT_ID && {
            'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
            'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
          }),
        },
      }
    } catch {
      console.warn('[vite] N8N_WEBHOOK_TARGET is not a valid URL — n8n proxy disabled')
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        },
        ...n8nProxy,
      },
    },
  }
})