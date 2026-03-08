import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResearchProject, getReviews } from '@/lib/queries';
import { getUser } from '@/lib/auth';
import DownloadButton from '@/components/DownloadButton';
import CitationExport from '@/components/research/citation-export';

export const dynamic = 'force-dynamic';

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  
  const research = await getResearchProject(id);
  
  if (!research) {
    notFound();
  }

  // Check if user can view this research
  const canView = research.status === 'approved' || research.status === 'published' || 
    (user && (user.role === 'admin' || user.id === research.created_by));

  if (!canView) {
    notFound();
  }

  const reviews = await getReviews(id);

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/research"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        ← Back to Research
      </Link>

      {/* Research Details */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-3">
              {research.category?.name}
            </span>
            <h1 className="text-3xl font-bold text-gray-900">{research.title}</h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              research.status === 'published'
                ? 'bg-green-100 text-green-800'
                : research.status === 'approved'
                ? 'bg-blue-100 text-blue-800'
                : research.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {research.status}
          </span>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y mb-6">
          <div>
            <div className="text-sm text-gray-500">Publication Year</div>
            <div className="font-medium">{research.publication_year}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Downloads</div>
            <div className="font-medium">{research.download_count || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Created</div>
            <div className="font-medium">
              {new Date(research.created_at).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Authors</div>
            <div className="font-medium">
              {research.authors?.map((a) => a.author_name).join(', ')}
            </div>
          </div>
        </div>

        {/* Abstract */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Abstract</h2>
          <p className="text-gray-700 leading-relaxed">
            {research.abstract || 'No abstract available.'}
          </p>
        </div>

        {/* Keywords */}
        {research.keywords && research.keywords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {research.keywords.map((kw) => (
                <span
                  key={kw.id}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <CitationExport
            title={research.title}
            year={research.publication_year}
            authors={research.authors?.map((a) => a.author_name) || []}
            url={`/research/${research.id}`}
          />
        </div>

        {/* Files */}
        {research.files && research.files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Files</h2>
            <div className="space-y-3">
              {research.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium">{file.file_name}</div>
                      <div className="text-sm text-gray-500">
                        {file.file_type} • {Math.round((file.file_size || 0) / 1024)} KB
                      </div>
                    </div>
                  </div>
                  <DownloadButton fileUrl={file.file_url} researchId={research.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {review.admin?.full_name || 'Admin'}
                  </div>
                  <span
                    className={`text-sm ${
                      review.decision === 'approved'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {review.decision}
                  </span>
                </div>
                <p className="text-gray-600">{review.comment}</p>
                <div className="text-sm text-gray-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

