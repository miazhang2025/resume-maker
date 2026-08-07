import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel serves api/*.js automatically in production, but `vite dev` does not.
// This runs the same handler behind the same URL locally, so development and
// production exercise one code path.
function serveApiInDev() {
  return {
    name: 'serve-api-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        // Minimal stand-in for the Vercel request/response objects. The handler
        // only uses `method`, `body`, `status()` and `json()`.
        const send = (code, obj) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
        }
        const shimRes = {
          status(code) {
            return { json: obj => send(code, obj) }
          },
        }

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk

          // ssrLoadModule picks up edits to api/claude.js without a restart.
          const mod = await server.ssrLoadModule('/api/claude.js')
          await mod.default({ method: 'POST', body: raw ? JSON.parse(raw) : {} }, shimRes)
        } catch (err) {
          server.config.logger.error(`[api/claude] ${err.stack || err}`)
          if (!res.writableEnded) send(500, { error: err.message || 'Dev server error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Third argument '' loads every variable, not just the VITE_-prefixed ones.
  // ANTHROPIC_API_KEY is deliberately un-prefixed so Vite cannot inline it into
  // the client bundle; it is handed to the dev-only handler via process.env.
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    plugins: [react(), tailwindcss(), serveApiInDev()],
  }
})
