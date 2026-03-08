'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveResearch, rejectResearch } from '@/actions/research';

interface AdminActionsProps {
  researchId: string;
}

export default function AdminActions({ researchId }: AdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await approveResearch(researchId, 'Approved by admin');
      setSuccess('Research approved successfully.');
      router.refresh();
    } catch (error) {
      console.error('Approve error:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve research.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await rejectResearch(researchId, rejectComment);
      router.refresh();
      setShowRejectModal(false);
      setRejectComment('');
      setSuccess('Research rejected successfully.');
    } catch (error) {
      console.error('Reject error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject research.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            handleApprove();
          }}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Research</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this research submission.
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectComment('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectComment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

