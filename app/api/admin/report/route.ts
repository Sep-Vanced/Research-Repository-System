import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getDashboardStats } from '@/lib/queries';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/security/rate-limit';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const requestHeaders = await headers();
  const ip = getClientIpFromHeaders(requestHeaders);

  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const rateState = checkRateLimit({
    namespace: 'admin-report-export',
    key: `${user.id}:${ip}`,
    max: 10,
    windowMs: 10 * 60_000,
  });

  if (!rateState.allowed) {
    return new NextResponse('Too many export requests.', {
      status: 429,
      headers: { 'Retry-After': String(rateState.retryAfterSec) },
    });
  }

  const stats = await getDashboardStats();
  const lines = [
    ['Metric', 'Value'],
    ['Total Research', String(stats.totalResearch)],
    ['Pending Research', String(stats.pendingResearch)],
    ['Approved Research', String(stats.approvedResearch)],
    ['Rejected Research', String(stats.rejectedResearch)],
    ['Total Downloads', String(stats.totalDownloads)],
    ['Generated At', new Date().toISOString()],
    [],
    ['Research By Year', 'Count'],
    ...stats.researchByYear.map((row) => [String(row.year), String(row.count)]),
    [],
    ['Research By Category', 'Count'],
    ...stats.researchByCategory.map((row) => [row.category, String(row.count)]),
  ];

  const csv = lines.map((row) => row.map((cell = '') => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="admin-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
