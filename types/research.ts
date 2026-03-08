export type UserRole = 'admin' | 'researcher' | 'viewer';
export type ResearchStatus = 'pending' | 'approved' | 'rejected' | 'published';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  institution?: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  abstract?: string;
  category_id?: string;
  category?: ResearchCategory;
  publication_year: number;
  status: ResearchStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  authors?: ResearchAuthor[];
  keywords?: ResearchKeyword[];
  files?: ResearchFile[];
  download_count?: number;
}

export interface ResearchAuthor {
  id: string;
  research_id: string;
  author_name: string;
  author_order: number;
  created_at: string;
}

export interface ResearchKeyword {
  id: string;
  research_id: string;
  keyword: string;
  created_at: string;
}

export interface ResearchFile {
  id: string;
  research_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Download {
  id: string;
  research_id: string;
  user_id: string;
  downloaded_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Review {
  id: string;
  research_id: string;
  admin_id: string;
  admin?: User;
  comment: string;
  decision: 'approved' | 'rejected';
  created_at: string;
}

export interface ResearchFilters {
  search?: string;
  category?: string;
  year?: number;
  author?: string;
  keyword?: string;
  status?: ResearchStatus;
}

export interface DashboardStats {
  totalResearch: number;
  researchByYear: { year: number; count: number }[];
  researchByCategory: { category: string; count: number }[];
  totalDownloads: number;
  pendingResearch: number;
  approvedResearch: number;
  rejectedResearch: number;
}

export interface Bookmark {
  id: string;
  user_id: string;
  research_id: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, string | number | null | undefined>;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  related_research_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CoauthorInvite {
  id: string;
  research_id: string;
  invited_by: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at?: string | null;
}

export interface TaxonomyKeyword {
  id: string;
  keyword: string;
  created_by?: string | null;
  created_at: string;
}

export interface AlertSubscription {
  id: string;
  user_id: string;
  scope: 'category' | 'keyword';
  value: string;
  channel: 'in_app' | 'email';
  enabled: boolean;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
  created_at: string;
}

