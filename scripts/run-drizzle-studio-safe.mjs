import { spawn } from 'node:child_process';

const nodeEnv = String(process.env.NODE_ENV || 'development').toLowerCase();
const allowInProd = String(process.env.ALLOW_DB_STUDIO_IN_PROD || '').toLowerCase() === 'true';

if (nodeEnv === 'production' && !allowInProd) {
  console.error('[db:studio] Blocked: Drizzle Studio is disabled in production by default.');
  console.error('[db:studio] If you really need it, set ALLOW_DB_STUDIO_IN_PROD=true temporarily.');
  process.exit(1);
}

const host = process.env.DB_STUDIO_HOST || '127.0.0.1';
const port = process.env.DB_STUDIO_PORT || '4983';

if (host === '0.0.0.0' && nodeEnv !== 'development') {
  console.error('[db:studio] Blocked: host 0.0.0.0 is only allowed in development.');
  process.exit(1);
}

const drizzleCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['drizzle-kit', 'studio', '--host', host, '--port', String(port)];

console.log(`[db:studio] Starting Drizzle Studio on http://${host}:${port}`);
const child = spawn(drizzleCmd, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[db:studio] Failed to start:', error.message);
  process.exit(1);
});
