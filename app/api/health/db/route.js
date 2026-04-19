/**
 * app/api/health/db/route.js — Database Health Check Endpoint
 *
 * GET /api/health/db
 *
 * Executes a lightweight "SELECT 1" ping against the MySQL database and
 * returns status + round-trip latency. Used by:
 *   - SideNav.jsx (polls every 30 s to show the DB status badge)
 *   - Infrastructure monitoring / uptime checks
 *
 * Response shape:
 *   200 OK:   { status: 'online',  latencyMs: number, checkedAt: ISO string }
 *   503 Fail: { status: 'offline', latencyMs: number, checkedAt: ISO string }
 *
 * Cache-Control is set to no-store so the response is never cached by
 * Next.js or CDN layers — always reflects live DB state.
 */
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/utils/dbConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    await db.execute(sql`select 1`);

    return NextResponse.json(
      {
        status: 'online',
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'offline',
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
