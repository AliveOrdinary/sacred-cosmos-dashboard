/**
 * Netlify Function: /api/render
 * Proxies reel render requests to the n8n reel-render webhook with
 * Cloudflare Access service-token headers injected server-side.
 * Same pattern as publish.mjs.
 *
 * Required Netlify env vars (server-only, no VITE_ prefix):
 *   N8N_RENDER_WEBHOOK_TARGET  – full n8n reel-render webhook URL
 *   CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET – shared with publish.mjs
 */

export const handler = async (event) => {
  const origin = event.headers.origin || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' }, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const webhookUrl = process.env.N8N_RENDER_WEBHOOK_TARGET
  if (!webhookUrl) {
    console.error('[render-proxy] N8N_RENDER_WEBHOOK_TARGET not set')
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ error: 'N8N_RENDER_WEBHOOK_TARGET not configured' }),
    }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CF_ACCESS_CLIENT_ID && {
          'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
          'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
        }),
      },
      body: event.body,
    })
    console.log('[render-proxy] n8n responded:', res.status)
  } catch (err) {
    console.error('[render-proxy] n8n fetch error:', err.message)
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify({ status: 'queued' }),
  }
}
