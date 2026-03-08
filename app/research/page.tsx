import { getResearchProjects, getCategories, getAvailableYears } from '@/lib/queries';
import ResearchCard from '@/components/ResearchCard';
import ResearchFilter from '@/components/ResearchFilter';
import { MOCK_RESEARCH_LIST } from '@/lib/mock-data';
import { getUser } from '@/lib/auth';
import { getMySavedSearches, getMyBookmarkedResearch } from '@/lib/queries';
import SaveSearchButton from '@/components/research/save-search-button';

export const dynamic = 'force-dynamic';

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const filters = {
    search: params.search as string | undefined,
    category: params.category as string | undefined,
    year: params.year ? parseInt(params.year as string) : undefined,
    keyword: params.keyword as string | undefined,
  };

  const user = await getUser();
  const [research, categories, years, savedSearches, bookmarked] = await Promise.all([
    getResearchProjects(filters, 20, 0),
    getCategories(),
    getAvailableYears(),
    user ? getMySavedSearches(user.id) : Promise.resolve([]),
    user ? getMyBookmarkedResearch(user.id) : Promise.resolve([]),
  ]);
  const displayResearch = research.length > 0 ? research : MOCK_RESEARCH_LIST;
  const bookmarkedIds = new Set(bookmarked.map((item) => item.id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-surface rounded-xl p-6">
        <h1 className="text-3xl font-bold text-blue-950">Browse Research</h1>
        <p className="mt-2 text-blue-900/80">
          Explore our collection of academic research from various disciplines.
        </p>
      </div>

      {/* Filters */}
      <ResearchFilter categories={categories} years={years} />
      {user ? (
        <div className="glass-surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <div className="flex flex-wrap gap-2">
            {savedSearches.length === 0 ? (
              <span className="text-sm text-blue-900/75">No saved searches yet.</span>
            ) : (
              savedSearches.slice(0, 6).map((search) => (
                <span key={search.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  {search.name}
                </span>
              ))
            )}
          </div>
          <SaveSearchButton filters={filters} />
        </div>
      ) : null}

      {/* Research Grid */}
      {research.length === 0 && (
        <div className="glass-surface rounded-xl p-4 text-center text-sm text-blue-900/75">
          Showing 5 mock entries because your database returned no records.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayResearch.map((item) => (
          <ResearchCard key={item.id} research={item} isBookmarked={bookmarkedIds.has(item.id)} />
        ))}
      </div>
    </div>
  );
}

