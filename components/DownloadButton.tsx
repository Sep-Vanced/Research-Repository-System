'use client';

import { useState } from 'react';
import { trackDownload } from '@/actions/research';

interface DownloadButtonProps {
  fileUrl: string;
  researchId: string;
}

export default function DownloadButton({ fileUrl, researchId }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      await trackDownload(researchId);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      setError(error instanceof Error ? error.message : 'Unable to download this file right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        Download
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

