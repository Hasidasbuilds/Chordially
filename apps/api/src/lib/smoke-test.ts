import https from 'node:https';
import http from 'node:http';

const BASE_URL = process.env.SMOKE_TARGET ?? 'http://localhost:3000';

interface SmokeResult {
  route: string;
  status: number;
  ok: boolean;
  ms: number;
}

function get(url: string, token?: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }, (res) => {
      res.resume();
      resolve({ status: res.statusCode ?? 0 });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('timeout')); });
  });
}

async function probe(route: string, token?: string): Promise<SmokeResult> {
  const start = Date.now();
  const { status } = await get(`${BASE_URL}${route}`, token);
  return { route, status, ok: status >= 200 && status < 400, ms: Date.now() - start };
}

export async function runSmoke(): Promise<void> {
  const token = process.env.SMOKE_TOKEN;

  const checks = await Promise.all([
    probe('/health'),
    probe('/ready'),
    probe('/api/v1/profile', token),
  ]);

  let failed = 0;
  for (const r of checks) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon}  ${r.route}  →  ${r.status}  (${r.ms}ms)`);
    if (!r.ok) failed++;
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }

  console.log('\nAll smoke checks passed');
}

if (require.main === module) {
  runSmoke().catch((err) => { console.error(err); process.exit(1); });
}
