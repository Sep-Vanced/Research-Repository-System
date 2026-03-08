import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { getPendingResearch, getDashboardStats, getUsers, getCategories, getTaxonomyKeywords } from '@/lib/queries';
import AdminActions from '@/components/AdminActions';
import UserRoleManager from '@/components/admin/user-role-manager';
import TaxonomyManager from '@/components/admin/taxonomy-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [pendingResearch, stats, users, categories, taxonomyKeywords] = await Promise.all([
    getPendingResearch(),
    getDashboardStats(),
    getUsers(),
    getCategories(),
    getTaxonomyKeywords(),
  ]);

  return (
    <div className="space-y-8">
      <Card className="glass-surface rounded-xl">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <p className="text-[var(--foreground)]/80">Moderate submissions and monitor repository activity.</p>
          <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/api/admin/report"
              className="inline-flex rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Export CSV Report
            </Link>
            <Link
              href="/admin/security"
              className="inline-flex rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Security Event Center
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Research', value: stats.totalResearch, tone: 'text-blue-700' },
          { label: 'Pending Review', value: stats.pendingResearch, tone: 'text-amber-600' },
          { label: 'Approved', value: stats.approvedResearch, tone: 'text-emerald-600' },
          { label: 'Downloads', value: stats.totalDownloads, tone: 'text-indigo-600' },
        ].map((item) => (
          <Card key={item.label} className="glass-surface rounded-xl">
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${item.tone}`}>{item.value}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/70">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-surface rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingResearch.length === 0 ? (
            <p className="py-8 text-center text-[var(--foreground)]/70">No pending submissions.</p>
          ) : (
            pendingResearch.map((research) => (
              <div
                key={research.id}
                className="rounded-lg border border-blue-100 bg-white/90 p-4 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/research/${research.id}`} className="text-lg font-semibold text-[var(--foreground)] hover:text-blue-500">
                      {research.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground)]/80">{research.abstract}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--foreground)]/70">
                      <span>{research.category?.name}</span>
                      <span>{research.publication_year}</span>
                      <span className="line-clamp-1">
                        {research.authors?.map((a) => a.author_name).join(', ')}
                      </span>
                      <span>Submitted: {new Date(research.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <AdminActions researchId={research.id} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="glass-surface rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">User Role Management</CardTitle>
          <p className="text-[var(--foreground)]/75">Set access level for each account.</p>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-4 text-sm text-[var(--foreground)]/70">No users found.</p>
          ) : (
            <UserRoleManager users={users} />
          )}
        </CardContent>
      </Card>

      <Card className="glass-surface rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Taxonomy Manager</CardTitle>
          <p className="text-[var(--foreground)]/75">Manage controlled categories and keywords.</p>
        </CardHeader>
        <CardContent>
          <TaxonomyManager categories={categories} keywords={taxonomyKeywords} />
        </CardContent>
      </Card>
    </div>
  );
}
