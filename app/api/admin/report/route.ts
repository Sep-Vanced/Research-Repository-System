import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getDashboardStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
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
    },
  });
}
