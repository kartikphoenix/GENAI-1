import React, { useState } from 'react';
import { RefreshCw, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminControlsProps {
  onStatusUpdate: (message: string, type: 'system' | 'error') => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({ onStatusUpdate }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // If user is not admin, don't render anything
  if (user?.role !== 'admin') {
    return null;
  }

  const clearEmbeddings = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('http://localhost:3001/api/clear-embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to clear embeddings');
      
      onStatusUpdate('Embeddings cleared successfully', 'system');
      setShowConfirmation(false);
    } catch (error) {
      onStatusUpdate('Error clearing embeddings', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reprocessDocuments = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found in localStorage');
        onStatusUpdate('Authentication error - please log in again', 'error');
        return;
      }

      console.log('Starting reprocess operation...');
      const response = await fetch('http://localhost:3001/api/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ directory: './documents' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.error || 'Failed to reprocess documents');
      }
      
      console.log('Reprocess successful:', data);
      onStatusUpdate('Documents reprocessed successfully', 'system');
    } catch (error: any) {
      console.error('Reprocess error:', error);
      onStatusUpdate(
        error.message.includes('uuid') 
          ? 'Database error - please contact support' 
          : error.message || 'Error reprocessing documents', 
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showConfirmation ? (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg gap-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm font-medium">
              Are you sure you want to clear all embeddings?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearEmbeddings}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              Yes, clear
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200 disabled:opacity-50"
            title="Clear embeddings"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Clear</span>
          </button>
          <button
            onClick={reprocessDocuments}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 disabled:opacity-50"
            title="Reprocess documents"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Reprocess</span>
          </button>
        </>
      )}
    </div>
  );
};

export default AdminControls;