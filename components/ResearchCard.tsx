import Link from 'next/link';
import { ResearchProject } from '@/types/research';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BookmarkButton from '@/components/research/bookmark-button';

interface ResearchCardProps {
  research: ResearchProject;
  isBookmarked?: boolean;
}

export default function ResearchCard({ research, isBookmarked = false }: ResearchCardProps) {
  return (
    <Card className="group border-blue-100/90 bg-white/85 transition-all hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-blue-700">
          <span>{research.category?.name || 'Uncategorized'}</span>
          <span>{research.publication_year}</span>
        </div>
        <CardTitle className="line-clamp-2 text-xl">{research.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm text-blue-900/80">{research.abstract}</p>

        <p className="line-clamp-1 text-xs text-blue-900/75">
          Authors: {research.authors?.map((a) => a.author_name).join(', ') || 'N/A'}
        </p>

        <div className="flex items-center justify-between text-xs text-blue-900/70">
          <span>{research.download_count || 0} downloads</span>
          <div className="flex items-center gap-2">
            <BookmarkButton researchId={research.id} isBookmarked={isBookmarked} />
            <span className="rounded-full bg-blue-50 px-2 py-1">{research.status}</span>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/research/${research.id}`}>View Research</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
