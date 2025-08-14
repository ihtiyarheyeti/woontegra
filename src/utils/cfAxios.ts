import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

type Candidate = { url: string; params?: Record<string, any> };

function buildAgent(proxyUrl?: string) {
  if (!proxyUrl) return undefined;
  return proxyUrl.startsWith('https:')
    ? new HttpsProxyAgent(proxyUrl)
    : new HttpProxyAgent(proxyUrl);
}

function isCloudflareLike(err: any): boolean {
  const status = err?.response?.status;
  const server = err?.response?.headers?.server;
  const cfRay = err?.response?.headers?.['cf-ray'];
  // CF veya gateway 5xx/403 varyantları
  return (
    [556, 520, 522, 523, 524, 502, 503, 504, 403].includes(Number(status)) ||
    String(server || '').toLowerCase().includes('cloudflare') ||
    !!cfRay
  );
}

export async function cfGet(
  candidates: Candidate[],
  headers: Record<string, string>,
  proxyPool: string[],
  maxRetries = 2,
  backoffMs = 1200
) {
  const tried: string[] = [];
  const pool = [undefined, ...proxyPool]; // önce direkt dene, sonra proxy'ler
  let lastErr: any = null;
  for (const proxyUrl of pool) {
    const agent = buildAgent(proxyUrl);
    const client: AxiosInstance = axios.create({
      timeout: 25000,
      httpAgent: agent as any,
      httpsAgent: agent as any,
      validateStatus: () => true, // el ile kontrol
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
          // 4xx/5xx: CF/gateway tipi ise retry/backoff, değilse bırak
          if (!isCloudflareLike({ response: res })) break;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
          attempt++;
        } catch (e: any) {
          lastErr = e;
          tried.push(`${cand.url}${proxyUrl ? ` via ${proxyUrl}` : ''} -> ERR ${e?.message || 'error'}`);
          if (!isCloudflareLike(e)) break;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
          attempt++;
        }
      }
    }
  }
  const err: any = new Error('Cloudflare/gateway nedeniyle upstream erişilemedi');
  err.tried = tried;
  err.last = lastErr?.message || lastErr;
  throw err;
}

export function getProxyPool(): string[] {
  const pool = (process.env.PROXY_POOL || '').split(';').map(s => s.trim()).filter(Boolean);
  const single = process.env.OUTBOUND_PROXY_URL?.trim();
  return pool.length ? pool : (single ? [single] : []);
}
