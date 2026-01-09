// components/ConfirmationModal.js
// Reusable confirmation modal with variants for different actions

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * ConfirmationModal - A calm, accessible confirmation dialog
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Called when modal closes (cancel)
 * @param {function} onConfirm - Called when user confirms
 * @param {string} title - Modal title
 * @param {string} message - Main message text
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} variant - 'default' | 'warning' | 'danger'
 * @param {boolean} loading - Show loading state on confirm
 * @param {React.ReactNode} children - Additional content
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  children,
}) {
  const [mounted, setMounted] = useState(false);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen && !loading) {
      onClose();
    }
  }, [isOpen, loading, onClose]);

  useEffect(() => {
    setMounted(true);
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const variantStyles = {
    default: {
      confirmBg: 'var(--color-primary, #3b82f6)',
      confirmHover: 'var(--color-primary-dark, #2563eb)',
      icon: '✓',
    },
    warning: {
      confirmBg: 'var(--color-warning, #f59e0b)',
      confirmHover: 'var(--color-warning-dark, #d97706)',
      icon: '⚠️',
    },
    danger: {
      confirmBg: 'var(--color-danger, #ef4444)',
      confirmHover: 'var(--color-danger-dark, #dc2626)',
      icon: '⚠️',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-icon">{style.icon}</span>
          <h2 id="modal-title" className="modal-title">{title}</h2>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {children}
        </div>
        
        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
            style={{
              '--btn-bg': style.confirmBg,
              '--btn-hover': style.confirmHover,
            }}
          >
            {loading ? (
              <span className="modal-loading">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--color-bg, white);
          border-radius: 12px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .modal-icon {
          font-size: 1.25rem;
        }

        .modal-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text, #1f2937);
        }

        .modal-body {
          padding: 1.25rem 1.5rem;
        }

        .modal-message {
          margin: 0;
          color: var(--color-text-muted, #6b7280);
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-btn-cancel {
          background: var(--color-bg-secondary, #f3f4f6);
          color: var(--color-text, #1f2937);
        }

        .modal-btn-cancel:hover:not(:disabled) {
          background: var(--color-bg-tertiary, #e5e7eb);
        }

        .modal-btn-confirm {
          background: var(--btn-bg);
          color: white;
        }

        .modal-btn-confirm:hover:not(:disabled) {
          background: var(--btn-hover);
        }

        .modal-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .modal-content {
            margin: 0.5rem;
          }
          
          .modal-actions {
            flex-direction: column-reverse;
          }
          
          .modal-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * EditConfirmationModal - Specialized modal for entry edits
 */
export function EditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  entryName,
  changesCount = 0,
  loading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Changes"
      message={`You're about to update ${entryName ? `"${entryName}"` : 'your picks'}. This action will be recorded.`}
      confirmText="Save Changes"
      cancelText="Keep Editing"
      variant="warning"
      loading={loading}
    >
      {changesCount > 0 && (
        <p style={{ 
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'var(--color-warning-light, #fef3c7)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: 'var(--color-warning-dark, #92400e)',
        }}>
          {changesCount} pick{changesCount !== 1 ? 's' : ''} will be changed.
        </p>
      )}
    </ConfirmationModal>
  );
}

/**
 * DeleteConfirmationModal - Specialized modal for deletions
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  loading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}?`}
      message={`Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}? This cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      loading={loading}
    />
  );
}
