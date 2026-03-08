import Link from 'next/link';
import { ResearchProject } from '@/types/research';

interface TimelineViewProps {
  data: { year: number; projects: ResearchProject[] }[];
}

export default function TimelineView({ data }: TimelineViewProps) {
  return (
    <div className="space-y-8">
      {data.map((yearGroup) => (
        <div key={yearGroup.year} className="relative">
          {/* Year Badge */}
          <div className="flex items-center mb-4">
            <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-lg font-bold">
              {yearGroup.year}
            </div>
            <div className="flex-1 h-px bg-gray-300 ml-4" />
          </div>

          {/* Research Items */}
          <div className="space-y-4 ml-8">
            {yearGroup.projects.map((project) => (
              <Link
                key={project.id}
                href={`/research/${project.id}`}
                className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                      {project.abstract}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{project.category?.name}</span>
                      <span>
                        {project.authors?.map((a) => a.author_name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="ml-4 text-sm text-gray-500">
                    {project.download_count || 0} downloads
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No research publications yet.
        </div>
      )}
    </div>
  );
}

