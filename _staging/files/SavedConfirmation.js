// components/SavedConfirmation.js
// Pre-lock "Your picks are saved" confirmation states

'use client';

import { useState, useEffect } from 'react';

/**
 * SavedConfirmation - Shows confirmation when picks are saved
 * 
 * Variants:
 * - toast: Temporary notification that auto-dismisses
 * - banner: Persistent banner at top of form
 * - inline: Inline status indicator
 */

/**
 * Toast notification for save confirmation
 */
export function SavedToast({ 
  show, 
  onDismiss, 
  message = 'Your picks have been saved!',
  duration = 4000,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`saved-toast ${exiting ? 'exiting' : ''}`}>
      <span className="toast-icon">✓</span>
      <span className="toast-message">{message}</span>
      <button 
        className="toast-dismiss" 
        onClick={() => {
          setExiting(true);
          setTimeout(() => {
            setVisible(false);
            onDismiss?.();
          }, 300);
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
      
      <style jsx>{`
        .saved-toast {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.25rem;
          background: var(--color-success, #22c55e);
          color: white;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          font-size: 0.9375rem;
          font-weight: 500;
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
        }

        .saved-toast.exiting {
          animation: slideDown 0.3s ease-in forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          font-size: 0.75rem;
        }

        .toast-message {
          flex: 1;
        }

        .toast-dismiss {
          background: none;
          border: none;
          color: white;
          opacity: 0.7;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.875rem;
          line-height: 1;
        }

        .toast-dismiss:hover {
          opacity: 1;
        }

        @media (max-width: 480px) {
          .saved-toast {
            left: 1rem;
            right: 1rem;
            transform: none;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(20px);
            }
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Persistent banner showing saved status
 */
export function SavedBanner({
  savedAt,
  entryName,
  isComplete = true,
  onEdit,
  editStatus,
}) {
  const formattedTime = savedAt 
    ? new Date(savedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={`saved-banner ${isComplete ? 'complete' : 'partial'}`}>
      <div className="banner-main">
        <span className="banner-icon">{isComplete ? '✓' : '⏳'}</span>
        <div className="banner-text">
          <strong>
            {isComplete ? 'Your picks are saved!' : 'Picks in progress'}
          </strong>
          {entryName && (
            <span className="entry-name">Entry: {entryName}</span>
          )}
        </div>
      </div>
      
      <div className="banner-meta">
        {formattedTime && (
          <span className="saved-time">Last saved: {formattedTime}</span>
        )}
        {onEdit && editStatus?.canEdit && (
          <button className="edit-link" onClick={onEdit}>
            Edit picks
          </button>
        )}
      </div>

      <style jsx>{`
        .saved-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }

        .saved-banner.complete {
          background: var(--color-success-light, #dcfce7);
          border: 1px solid var(--color-success-border, #bbf7d0);
        }

        .saved-banner.partial {
          background: var(--color-warning-light, #fef3c7);
          border: 1px solid var(--color-warning-border, #fde68a);
        }

        .banner-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .banner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.875rem;
        }

        .complete .banner-icon {
          background: var(--color-success, #22c55e);
          color: white;
        }

        .partial .banner-icon {
          background: var(--color-warning, #f59e0b);
          color: white;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .banner-text strong {
          font-size: 0.9375rem;
          color: var(--color-text, #1f2937);
        }

        .entry-name {
          font-size: 0.8125rem;
          color: var(--color-text-muted, #6b7280);
        }

        .banner-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .saved-time {
          font-size: 0.8125rem;
          color: var(--color-text-muted, #6b7280);
        }

        .edit-link {
          background: none;
          border: none;
          color: var(--color-primary, #3b82f6);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .edit-link:hover {
          color: var(--color-primary-dark, #2563eb);
        }

        @media (max-width: 480px) {
          .saved-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Inline status indicator for forms
 */
export function SavedStatus({
  status, // 'saved' | 'saving' | 'unsaved' | 'error'
  savedAt,
  message,
}) {
  const config = {
    saved: {
      icon: '✓',
      text: message || 'Saved',
      color: 'var(--color-success, #22c55e)',
    },
    saving: {
      icon: '↻',
      text: message || 'Saving...',
      color: 'var(--color-text-muted, #6b7280)',
      animate: true,
    },
    unsaved: {
      icon: '○',
      text: message || 'Unsaved changes',
      color: 'var(--color-warning, #f59e0b)',
    },
    error: {
      icon: '✕',
      text: message || 'Save failed',
      color: 'var(--color-danger, #ef4444)',
    },
  };

  const current = config[status] || config.saved;

  return (
    <div className="saved-status" style={{ color: current.color }}>
      <span className={`status-icon ${current.animate ? 'spinning' : ''}`}>
        {current.icon}
      </span>
      <span className="status-text">{current.text}</span>
      {status === 'saved' && savedAt && (
        <span className="status-time">
          {new Date(savedAt).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      )}

      <style jsx>{`
        .saved-status {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
        }

        .status-icon {
          font-size: 0.75rem;
        }

        .status-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .status-text {
          font-weight: 500;
        }

        .status-time {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

/**
 * Full-page confirmation after submission
 */
export function SubmissionConfirmation({
  entryName,
  poolName,
  eventName,
  lockTime,
  onViewPicks,
  onViewStandings,
  editStatus,
}) {
  const lockDate = lockTime ? new Date(lockTime) : null;
  
  return (
    <div className="submission-confirmation">
      <div className="confirmation-icon">🎉</div>
      <h1 className="confirmation-title">You're All Set!</h1>
      <p className="confirmation-subtitle">
        Your picks for <strong>{poolName || eventName}</strong> have been submitted.
      </p>
      
      <div className="confirmation-details">
        {entryName && (
          <div className="detail-row">
            <span className="detail-label">Entry Name</span>
            <span className="detail-value">{entryName}</span>
          </div>
        )}
        {lockDate && (
          <div className="detail-row">
            <span className="detail-label">Picks Lock</span>
            <span className="detail-value">
              {lockDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })} at {lockDate.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
        {editStatus?.canEdit && (
          <div className="detail-row highlight">
            <span className="detail-label">Edit Window</span>
            <span className="detail-value">{editStatus.message}</span>
          </div>
        )}
      </div>

      <div className="confirmation-actions">
        {onViewPicks && (
          <button className="action-btn action-primary" onClick={onViewPicks}>
            View My Picks
          </button>
        )}
        {onViewStandings && (
          <button className="action-btn action-secondary" onClick={onViewStandings}>
            View Standings
          </button>
        )}
      </div>

      <style jsx>{`
        .submission-confirmation {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
          margin: 0 auto;
        }

        .confirmation-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 0.5s ease-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .confirmation-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text, #1f2937);
        }

        .confirmation-subtitle {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
          color: var(--color-text-muted, #6b7280);
          line-height: 1.5;
        }

        .confirmation-details {
          background: var(--color-bg-secondary, #f9fafb);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row.highlight {
          background: var(--color-success-light, #dcfce7);
          margin: 0.5rem -1rem -1rem;
          padding: 0.75rem 1rem;
          border-radius: 0 0 10px 10px;
        }

        .detail-label {
          font-size: 0.8125rem;
          color: var(--color-text-muted, #6b7280);
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text, #1f2937);
        }

        .confirmation-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .action-primary {
          background: var(--color-primary, #3b82f6);
          color: white;
        }

        .action-primary:hover {
          background: var(--color-primary-dark, #2563eb);
        }

        .action-secondary {
          background: var(--color-bg-secondary, #f3f4f6);
          color: var(--color-text, #1f2937);
        }

        .action-secondary:hover {
          background: var(--color-bg-tertiary, #e5e7eb);
        }
      `}</style>
    </div>
  );
}
