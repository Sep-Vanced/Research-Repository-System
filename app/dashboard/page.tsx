import { getUser } from '@/lib/auth';
import { getResearchByUser, getDashboardStats, getSubmissionTimeline, getMyCoauthorInvites, getRecommendedResearch } from '@/lib/queries';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ClipboardList, Download, FileText, Hourglass, XCircle } from 'lucide-react';
import CoauthorInvites from '@/components/dashboard/coauthor-invites';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const [myResearch, stats, timeline, coauthorInvites, recommendations] = await Promise.all([
    getResearchByUser(user.id),
    getDashboardStats(),
    getSubmissionTimeline(user.id),
    getMyCoauthorInvites(user.email),
    getRecommendedResearch(user.id, 6),
  ]);

  const completed = stats.approvedResearch;
  const pending = stats.pendingResearch;
  const total = Math.max(stats.totalResearch, 1);
  const completionRatio = Math.min(Math.max(Math.round((completed / total) * 100), 0), 100);

  const rejectedCount = myResearch.filter((item) => item.status === 'rejected').length;
  const publishedCount = myResearch.filter((item) => item.status === 'published').length;

  const latestResearch = myResearch[0];
  type TimelineItem = {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    reviews?: { comment: string }[];
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Hello, {user.full_name || 'Researcher'}!
        </h1>
        <p className="mt-2 text-slate-500">
          Welcome to your research portal. Access your records, submissions, and repository services.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        {[
          {
            label: 'Research Number',
            value: stats.totalResearch,
            icon: <ClipboardList className="h-4 w-4 text-blue-600" />,
            help: 'Total submissions',
          },
          {
            label: 'User Role',
            value: String(user.role).toUpperCase(),
            icon: <FileText className="h-4 w-4 text-blue-600" />,
            help: 'Current profile access',
          },
          {
            label: 'Total Downloads',
            value: stats.totalDownloads,
            icon: <Download className="h-4 w-4 text-blue-600" />,
            help: 'Repository interactions',
          },
          {
            label: 'Approved Research',
            value: stats.approvedResearch,
            icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
            help: 'Accepted for viewing',
          },
          {
            label: 'Pending Review',
            value: stats.pendingResearch,
            icon: <Hourglass className="h-4 w-4 text-blue-600" />,
            help: 'Waiting for admin review',
          },
          {
            label: 'Rejected Research',
            value: rejectedCount,
            icon: <XCircle className="h-4 w-4 text-blue-600" />,
            help: 'Needs revision or update',
          },
        ].map((card) => (
          <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">{card.icon}</div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.help}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Research Statistics</h2>
          <div className="mt-4 space-y-3">
            {[
              ['Submitted Research', stats.totalResearch],
              ['Approved', stats.approvedResearch],
              ['Rejected', rejectedCount],
              ['Published', publishedCount],
              ['Pending', pending],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Completion Overview</h2>
          <div className="mt-4 flex flex-col items-center">
            <div
              className="relative grid h-44 w-44 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#2f7cf7 ${completionRatio}%, #e5edf8 ${completionRatio}% 100%)`,
              }}
            >
              <div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center">
                <span className="text-3xl font-bold text-slate-800">{completionRatio}%</span>
                <span className="text-xs uppercase tracking-widest text-slate-400">completed</span>
              </div>
            </div>
            <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-4 text-xs">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Approved
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                Pending
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Rejected
              </span>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Recent Activity</h2>
          {latestResearch ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-lg font-semibold text-slate-800">{latestResearch.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {latestResearch.category?.name || 'Uncategorized'} - {latestResearch.publication_year}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{latestResearch.abstract || 'No abstract provided.'}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                  {latestResearch.status}
                </span>
                <Link href={`/research/${latestResearch.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                  Open record
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No submissions yet. Start by creating your first research record.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 h-4 w-4 text-slate-500" />
              <div>
                <p className="font-semibold text-slate-700">Today&apos;s Reminder</p>
                <p className="text-sm text-slate-500">
                  Keep metadata and authorship details complete for better repository indexing.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
        <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Submission Timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No submission events yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {(timeline as TimelineItem[]).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold uppercase text-blue-700">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Created: {new Date(item.created_at).toLocaleDateString()} | Updated: {new Date(item.updated_at).toLocaleDateString()}
                </p>
                {item.reviews?.length ? (
                  <p className="mt-2 text-sm text-slate-600">Latest review: {item.reviews[0].comment}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
        <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Co-author Invites</h2>
        <CoauthorInvites invites={coauthorInvites} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
        <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-600">Recommended For You</h2>
        {recommendations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No personalized recommendations yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((item) => (
              <Link key={item.id} href={`/research/${item.id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.category?.name || 'Uncategorized'} • {item.publication_year}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

