import { DashboardStats } from '@/types/research';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export default function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-primary-600">{stats.totalResearch}</div>
        <div className="text-gray-600 text-sm mt-1">Total Research</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-yellow-600">{stats.pendingResearch}</div>
        <div className="text-gray-600 text-sm mt-1">Pending Review</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-green-600">{stats.approvedResearch}</div>
        <div className="text-gray-600 text-sm mt-1">Approved</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-blue-600">{stats.totalDownloads}</div>
        <div className="text-gray-600 text-sm mt-1">Total Downloads</div>
      </div>
    </div>
  );
}

