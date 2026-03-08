import { createServiceClient } from '@/lib/supabase/index';
import { 
  ResearchProject, 
  ResearchCategory, 
  ResearchFilters, 
  DashboardStats,
  User,
  SavedSearch,
  NotificationItem,
  CoauthorInvite,
  TaxonomyKeyword,
  AlertSubscription,
  AuditEvent
} from '@/types/research';

type YearRow = { publication_year: number };
type CategoryRow = { category: { name: string } | null };
type KeywordRow = { keyword: string };
type BookmarkRow = { research_id: string };
type DownloadedResearchRow = { research: { category_id: string | null }[] | null };
const isMissingTableError = (error: { code?: string } | null | undefined) => error?.code === '42P01';

// Get all categories
export async function getCategories(): Promise<ResearchCategory[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('research_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Get research projects with filters
export async function getResearchProjects(
  filters?: ResearchFilters,
  limit = 20,
  offset = 0
): Promise<ResearchProject[]> {
  const supabase = createServiceClient();
  
  let query = supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply status filter - default to showing approved/published
  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default to showing approved and published
    query = query.in('status', ['approved', 'published']);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
  }

  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters?.year) {
    query = query.eq('publication_year', filters.year);
  }

  if (filters?.keyword) {
    query = query.eq('keywords.keyword', filters.keyword);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Get download counts for each project
  const projectsWithDownloads = await Promise.all(
    ((data as ResearchProject[] | null) || []).map(async (project) => {
      const { count } = await supabase
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('research_id', project.id);
      
      return { ...project, download_count: count || 0 };
    })
  );

  return projectsWithDownloads;
}

// Get single research project
export async function getResearchProject(id: string): Promise<ResearchProject | null> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  
  // Get download count
  const { count } = await supabase
    .from('downloads')
    .select('*', { count: 'exact', head: true })
    .eq('research_id', id);

  return { ...data, download_count: count || 0 };
}

// Get research by user
export async function getResearchByUser(userId: string): Promise<ResearchProject[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get pending research for admin
export async function getPendingResearch(): Promise<ResearchProject[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServiceClient();
  
  // Total research
  const { count: totalResearch } = await supabase
    .from('research_projects')
    .select('*', { count: 'exact', head: true });

  // Research by year
  const { data: yearData } = await supabase
    .from('research_projects')
    .select('publication_year');
  
  const yearCounts: Record<number, number> = {};
  (yearData as YearRow[] | null)?.forEach((item) => {
    yearCounts[item.publication_year] = (yearCounts[item.publication_year] || 0) + 1;
  });
  
  const researchByYear = Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => b.year - a.year);

  // Research by category
  const { data: categoryData } = await supabase
    .from('research_projects')
    .select('category:research_categories(name)');
  
  const categoryCounts: Record<string, number> = {};
  (categoryData as CategoryRow[] | null)?.forEach((item) => {
    const catName = item.category?.name || 'Uncategorized';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });
  
  const researchByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Total downloads
  const { count: totalDownloads } = await supabase
    .from('downloads')
    .select('*', { count: 'exact', head: true });

  // Status counts
  const { count: pendingResearch } = await supabase
    .from('research_projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedResearch } = await supabase
    .from('research_projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedResearch } = await supabase
    .from('research_projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  return {
    totalResearch: totalResearch || 0,
    researchByYear,
    researchByCategory,
    totalDownloads: totalDownloads || 0,
    pendingResearch: pendingResearch || 0,
    approvedResearch: approvedResearch || 0,
    rejectedResearch: rejectedResearch || 0,
  };
}

// Get reviews for research
export async function getReviews(researchId: string) {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('research_id', researchId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get timeline data (research grouped by year)
export async function getTimelineData(): Promise<{ year: number; projects: ResearchProject[] }[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(name),
      authors:research_authors(*)
    `)
    .in('status', ['approved', 'published'])
    .order('publication_year', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by year
  const grouped: Record<number, ResearchProject[]> = {};
  (data as ResearchProject[] | null)?.forEach((project) => {
    const year = project.publication_year;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(project);
  });

  return Object.entries(grouped)
    .map(([year, projects]) => ({ year: parseInt(year), projects }))
    .sort((a, b) => b.year - a.year);
}

// Get all unique years from research
export async function getAvailableYears(): Promise<number[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_projects')
    .select('publication_year')
    .in('status', ['approved', 'published']);

  if (error) throw error;
  
  const years = new Set((data as YearRow[] | null)?.map((item) => item.publication_year) || []);
  return Array.from(years).sort((a, b) => b - a);
}

// Get all unique keywords
export async function getAllKeywords(): Promise<string[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('research_keywords')
    .select('keyword');

  if (error) throw error;
  
  const keywords = new Set((data as KeywordRow[] | null)?.map((item) => item.keyword) || []);
  return Array.from(keywords).sort();
}

export async function getUsers(): Promise<User[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as User[]) || [];
}

export async function getMySavedSearches(userId: string): Promise<SavedSearch[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as SavedSearch[]) || [];
}

export async function getMyBookmarkedResearch(userId: string): Promise<ResearchProject[]> {
  const supabase = createServiceClient();
  const { data: bookmarkRows, error: bookmarkError } = await supabase
    .from('bookmarks')
    .select('research_id')
    .eq('user_id', userId);

  if (bookmarkError) {
    if (isMissingTableError(bookmarkError)) return [];
    throw bookmarkError;
  }
  const bookmarkIds = ((bookmarkRows as BookmarkRow[] | null) || []).map((row) => row.research_id);
  if (!bookmarkIds.length) return [];

  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .in('id', bookmarkIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ResearchProject[]) || [];
}

export async function getMyNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as NotificationItem[]) || [];
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count || 0;
}

export async function getSubmissionTimeline(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      id,
      title,
      status,
      created_at,
      updated_at,
      reviews:reviews(comment, decision, created_at)
    `)
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return data || [];
}

export async function getTaxonomyKeywords(): Promise<TaxonomyKeyword[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('taxonomy_keywords')
    .select('*')
    .order('keyword', { ascending: true });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as TaxonomyKeyword[]) || [];
}

export async function getMyCoauthorInvites(email: string): Promise<CoauthorInvite[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('coauthor_invites')
    .select('*')
    .ilike('invited_email', email)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as CoauthorInvite[]) || [];
}

export async function getMyAlertSubscriptions(userId: string): Promise<AlertSubscription[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as AlertSubscription[]) || [];
}

export async function getAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data as AuditEvent[]) || [];
}

export async function getRecommendedResearch(userId: string, limit = 6): Promise<ResearchProject[]> {
  const supabase = createServiceClient();

  const [bookmarks, downloads] = await Promise.all([
    supabase.from('bookmarks').select('research:research_projects(category_id)').eq('user_id', userId),
    supabase.from('downloads').select('research:research_projects(category_id)').eq('user_id', userId),
  ]);
  if (bookmarks.error && isMissingTableError(bookmarks.error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('research_projects')
      .select(`
        *,
        category:research_categories(*),
        authors:research_authors(*),
        keywords:research_keywords(*),
        files:research_files(*)
      `)
      .in('status', ['approved', 'published'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (fallbackError) throw fallbackError;
    return (fallbackData as ResearchProject[]) || [];
  }
  if (bookmarks.error) throw bookmarks.error;
  if (downloads.error) throw downloads.error;

  const categoryIds = new Set<string>();
  (((bookmarks.data as DownloadedResearchRow[] | null) || []).concat((downloads.data as DownloadedResearchRow[] | null) || [])).forEach((row) => {
    const cat = row.research?.[0]?.category_id;
    if (cat) categoryIds.add(cat);
  });

  let query = supabase
    .from('research_projects')
    .select(`
      *,
      category:research_categories(*),
      authors:research_authors(*),
      keywords:research_keywords(*),
      files:research_files(*)
    `)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (categoryIds.size > 0) {
    query = query.in('category_id', Array.from(categoryIds));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ResearchProject[]) || [];
}

