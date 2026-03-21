/**
 * Netlify serverless function: /api/publish  (via netlify.toml redirect)
 *
 * Proxies the publish payload to the n8n webhook, injecting Cloudflare Access
 * service token headers server-side so they are never exposed in the browser
 * bundle and CORS preflight issues are completely avoided.
 *
 * Required environment variables (set in Netlify dashboard, no VITE_ prefix):
 *   N8N_WEBHOOK_TARGET        – full n8n production webhook URL
 *   CF_ACCESS_CLIENT_ID       – Cloudflare Access service token client ID
 *   CF_ACCESS_CLIENT_SECRET   – Cloudflare Access service token client secret
 */

export default async (request, context) => {
  const origin = request.headers.get('origin') ?? '*'

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_TARGET
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: 'N8N_WEBHOOK_TARGET not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Forward the payload to n8n with CF Access headers — fire and forget.
  // We respond immediately with 200 so the browser doesn't time out waiting
  // for n8n's pipeline (which includes a 15-second Wait node).
  const body = await request.text()

  // Don't await — let n8n process in the background
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.CF_ACCESS_CLIENT_ID && {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
      }),
    },
    body,
  }).catch((err) => console.error('[publish-proxy] n8n fetch error:', err))

  return new Response(JSON.stringify({ status: 'queued' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  })
}

export const config = { path: '/api/publish' }
