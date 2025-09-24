import React, { useState, useEffect } from 'react';
import { Star, Edit3, Check, X, Loader2 } from 'lucide-react';
import { DocumentAPI } from '../../services/documentApi';

const DocumentScore = ({ 
  contractId, 
  onScoreUpdate,
  showSuccess, 
  showError 
}) => {
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editScore, setEditScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load score when component mounts or contractId changes
  useEffect(() => {
    if (contractId) {
      loadScore();
    }
  }, [contractId]);

  const loadScore = async () => {
    if (!contractId) return;
    
    setIsLoading(true);
    try {
      const response = await DocumentAPI.getDocumentScore(contractId);
      if (response.success) {
        setScore(response.score);
      }
    } catch (error) {
      console.error('Error loading document score:', error);
      if (showError) {
        showError(`Failed to load document score: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditScore(score?.toString() || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditScore('');
  };

  const handleSave = async () => {
    const newScore = parseInt(editScore);
    
    // Validate score
    if (isNaN(newScore) || newScore < 0 || newScore > 100) {
      if (showError) {
        showError('Score must be a number between 0 and 100');
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await DocumentAPI.updateDocumentScore(contractId, newScore);
      if (response.success) {
        setScore(response.score);
        setIsEditing(false);
        setEditScore('');
        
        if (showSuccess) {
          showSuccess('Document score updated successfully!');
        }
        
        // Notify parent component
        if (onScoreUpdate) {
          onScoreUpdate(response.score);
        }
      }
    } catch (error) {
      console.error('Error updating document score:', error);
      if (showError) {
        showError(`Failed to update score: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Get score color based on value
  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return 'text-green-600 dark:text-green-400';
    if (scoreValue >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (scoreValue >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get score background color
  const getScoreBgColor = (scoreValue) => {
    if (scoreValue >= 80) return 'bg-green-100 dark:bg-green-900';
    if (scoreValue >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    if (scoreValue >= 40) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  // Get score description
  const getScoreDescription = (scoreValue) => {
    if (scoreValue >= 80) return 'Excellent';
    if (scoreValue >= 60) return 'Good';
    if (scoreValue >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (!contractId) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Document Score
          </h3>
        </div>
        
        {/* {!isEditing && score !== null && (
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="Edit score"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )} */}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Loading score...</span>
        </div>
      ) : score === null ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No score available
          </p>
          <button
            onClick={loadScore}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      ) : isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={editScore}
              onChange={(e) => setEditScore(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter score (0-100)"
              autoFocus
            />
            <div className="flex space-x-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter a score between 0 and 100
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(score)} mb-2`}>
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-medium ${getScoreColor(score)}`}>
              {getScoreDescription(score)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              out of 100
            </p>
          </div>
          
          {/* Score bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  score >= 80 ? 'bg-green-500' :
                  score >= 60 ? 'bg-yellow-500' :
                  score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentScore;