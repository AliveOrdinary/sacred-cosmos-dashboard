/**
 * Netlify Function: /api/publish
 *
 * Proxies the publish payload to the n8n webhook with Cloudflare Access
 * service token headers injected server-side. Because n8n is configured
 * to "Respond: Immediately", the await resolves quickly and this function
 * completes well within Netlify's 10-second timeout.
 *
 * Required Netlify env vars (no VITE_ prefix — server-only):
 *   N8N_WEBHOOK_TARGET        – full n8n production webhook URL
 *   CF_ACCESS_CLIENT_ID       – Cloudflare Access service token client ID
 *   CF_ACCESS_CLIENT_SECRET   – Cloudflare Access service token client secret
 */

export const handler = async (event) => {
  const origin = event.headers.origin || '*'

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' }, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const webhookUrl = process.env.N8N_WEBHOOK_TARGET
  if (!webhookUrl) {
    console.error('[publish-proxy] N8N_WEBHOOK_TARGET not set')
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ error: 'N8N_WEBHOOK_TARGET not configured' }),
    }
  }

  try {
    // n8n is set to "Respond: Immediately" so this resolves quickly
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
    console.log('[publish-proxy] n8n responded:', res.status)
  } catch (err) {
    console.error('[publish-proxy] n8n fetch error:', err.message)
  }

  // Always return 200 to the browser — n8n processes asynchronously
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify({ status: 'queued' }),
  }
}
