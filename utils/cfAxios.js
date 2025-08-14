// CommonJS versiyon (Node için)
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

function buildAgent(proxyUrl) {
  if (!proxyUrl) return undefined;
  return proxyUrl.startsWith('https:')
    ? new HttpsProxyAgent(proxyUrl)
    : new HttpProxyAgent(proxyUrl);
}

function isCloudflareLike(err) {
  const status = err?.response?.status;
  const server = err?.response?.headers?.server;
  const cfRay = err?.response?.headers?.['cf-ray'];
  return (
    [556, 520, 522, 523, 524, 502, 503, 504, 403].includes(Number(status)) ||
    String(server || '').toLowerCase().includes('cloudflare') ||
    !!cfRay
  );
}

async function cfGet(candidates, headers, proxyPool, maxRetries = 2, backoffMs = 1200) {
  const tried = [];
  const pool = [undefined, ...(proxyPool || [])]; // önce direkt dene, sonra proxy'ler
  let lastErr = null;
  for (const proxyUrl of pool) {
    const agent = buildAgent(proxyUrl);
    const client = axios.create({
      timeout: 25000,
      httpAgent: agent,
      httpsAgent: agent,
      validateStatus: () => true,
    });
    for (const cand of candidates) {
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const res = await client.get(cand.url, { params: cand.params, headers });
          const status = res.status;
          const ray = res.headers?.['cf-ray'];
          tried.push(`${cand.url}${proxyUrl ? ` via ${proxyUrl}` : ''} -> ${status}${ray ? ' cf-ray:'+ray : ''}`);
          if (status >= 200 && status < 300) return { res, tried };
          if (!isCloudflareLike({ response: res })) break;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
          attempt++;
        } catch (e) {
          lastErr = e;
          tried.push(`${cand.url}${proxyUrl ? ` via ${proxyUrl}` : ''} -> ERR ${e?.message || 'error'}`);
          if (!isCloudflareLike(e)) break;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
          attempt++;
        }
      }
    }
  }
  const err = new Error('Cloudflare/gateway nedeniyle upstream erişilemedi');
  err.tried = tried;
  err.last = lastErr?.message || lastErr;
  throw err;
}

function getProxyPool() {
  const pool = String(process.env.PROXY_POOL || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  const single = process.env.OUTBOUND_PROXY_URL?.trim();
  return pool.length ? pool : (single ? [single] : []);
}

module.exports = { cfGet, getProxyPool };

