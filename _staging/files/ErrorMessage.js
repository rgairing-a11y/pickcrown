// components/ErrorMessage.js
// Better error messages with recovery suggestions

'use client';

import { useState } from 'react';

/**
 * Error types with their recovery suggestions
 */
export const ERROR_TYPES = {
  NETWORK: {
    title: 'Connection Problem',
    icon: '📡',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again',
    ],
  },
  NOT_FOUND: {
    title: 'Not Found',
    icon: '🔍',
    suggestions: [
      'The link may be incorrect or expired',
      'Check if you have the right URL',
      'Contact the pool commissioner for a new link',
    ],
  },
  PERMISSION: {
    title: 'Access Denied',
    icon: '🔒',
    suggestions: [
      'You may not have permission to view this',
      'Try logging in with a different email',
      'Contact the pool commissioner for access',
    ],
  },
  VALIDATION: {
    title: 'Invalid Input',
    icon: '⚠️',
    suggestions: [
      'Check that all required fields are filled',
      'Make sure your input is in the correct format',
      'Review the highlighted fields below',
    ],
  },
  LOCKED: {
    title: 'Picks Locked',
    icon: '🔐',
    suggestions: [
      'The deadline has passed for this event',
      'You can still view standings and results',
      'Contact the commissioner if you believe this is an error',
    ],
  },
  SERVER: {
    title: 'Something Went Wrong',
    icon: '😕',
    suggestions: [
      'This is usually temporary',
      'Try again in a few minutes',
      'If the problem persists, contact support',
    ],
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    icon: '⏱️',
    suggestions: [
      'The server is taking too long to respond',
      'Check your connection and try again',
      'Try refreshing the page',
    ],
  },
  DUPLICATE: {
    title: 'Already Exists',
    icon: '📋',
    suggestions: [
      'An entry with this information already exists',
      'Try using a different name or email',
      'Look for your existing entry instead',
    ],
  },
};

/**
 * Map HTTP status codes to error types
 */
export function getErrorTypeFromStatus(status) {
  const statusMap = {
    400: 'VALIDATION',
    401: 'PERMISSION',
    403: 'PERMISSION',
    404: 'NOT_FOUND',
    408: 'TIMEOUT',
    409: 'DUPLICATE',
    422: 'VALIDATION',
    423: 'LOCKED',
    429: 'TIMEOUT',
    500: 'SERVER',
    502: 'SERVER',
    503: 'SERVER',
    504: 'TIMEOUT',
  };
  return statusMap[status] || 'SERVER';
}

/**
 * Parse error from various sources
 */
export function parseError(error) {
  // Handle fetch errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'NETWORK',
      message: 'Unable to connect to the server',
      details: null,
    };
  }

  // Handle response errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    return {
      type: getErrorTypeFromStatus(status),
      message: error.message || error.error || 'An error occurred',
      details: error.details || null,
      status,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'SERVER',
      message: error,
      details: null,
    };
  }

  // Handle generic errors
  return {
    type: 'SERVER',
    message: error.message || 'An unexpected error occurred',
    details: error.details || null,
  };
}

/**
 * ErrorMessage Component
 * Displays user-friendly error messages with recovery suggestions
 */
export default function ErrorMessage({
  error,
  type: explicitType,
  title: explicitTitle,
  message: explicitMessage,
  suggestions: explicitSuggestions,
  onRetry,
  onDismiss,
  compact = false,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Parse the error
  const parsed = error ? parseError(error) : { type: explicitType || 'SERVER' };
  const errorConfig = ERROR_TYPES[parsed.type] || ERROR_TYPES.SERVER;

  const displayTitle = explicitTitle || errorConfig.title;
  const displayMessage = explicitMessage || parsed.message || 'Something went wrong';
  const displaySuggestions = explicitSuggestions || errorConfig.suggestions;
  const icon = errorConfig.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <div className={`error-compact ${className}`}>
        <span className="error-icon">{icon}</span>
        <span className="error-text">{displayMessage}</span>
        {onRetry && (
          <button onClick={onRetry} className="error-retry-link">
            Try again
          </button>
        )}
        
        <style jsx>{`
          .error-compact {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: var(--color-danger-light, #fef2f2);
            border: 1px solid var(--color-danger-border, #fecaca);
            border-radius: 8px;
            font-size: 0.875rem;
            color: var(--color-danger-text, #991b1b);
          }
          
          .error-icon {
            flex-shrink: 0;
          }
          
          .error-text {
            flex: 1;
          }
          
          .error-retry-link {
            background: none;
            border: none;
            color: var(--color-danger, #dc2626);
            text-decoration: underline;
            cursor: pointer;
            font-size: inherit;
            padding: 0;
          }
          
          .error-retry-link:hover {
            color: var(--color-danger-dark, #991b1b);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`error-container ${className}`}>
      <div className="error-header">
        <span className="error-icon">{icon}</span>
        <h3 className="error-title">{displayTitle}</h3>
        {onDismiss && (
          <button 
            onClick={handleDismiss} 
            className="error-dismiss"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
      
      <p className="error-message">{displayMessage}</p>
      
      {displaySuggestions && displaySuggestions.length > 0 && (
        <div className="error-suggestions">
          <p className="suggestions-label">What you can try:</p>
          <ul className="suggestions-list">
            {displaySuggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {onRetry && (
        <div className="error-actions">
          <button onClick={onRetry} className="error-retry-btn">
            Try Again
          </button>
        </div>
      )}

      <style jsx>{`
        .error-container {
          background: var(--color-danger-light, #fef2f2);
          border: 1px solid var(--color-danger-border, #fecaca);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1rem 0;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 0.75rem;
        }

        .error-icon {
          font-size: 1.25rem;
        }

        .error-title {
          margin: 0;
          flex: 1;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-danger-text, #991b1b);
        }

        .error-dismiss {
          background: none;
          border: none;
          color: var(--color-danger-text, #991b1b);
          opacity: 0.6;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
          line-height: 1;
        }

        .error-dismiss:hover {
          opacity: 1;
        }

        .error-message {
          margin: 0 0 1rem 0;
          color: var(--color-danger-text, #7f1d1d);
          line-height: 1.5;
        }

        .error-suggestions {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          padding: 0.875rem;
          margin-bottom: 1rem;
        }

        .suggestions-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-danger-text, #991b1b);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .suggestions-list {
          margin: 0;
          padding-left: 1.25rem;
          color: var(--color-danger-text, #7f1d1d);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .suggestions-list li {
          margin-bottom: 0.25rem;
        }

        .suggestions-list li:last-child {
          margin-bottom: 0;
        }

        .error-actions {
          display: flex;
          gap: 0.75rem;
        }

        .error-retry-btn {
          padding: 0.5rem 1rem;
          background: var(--color-danger, #dc2626);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .error-retry-btn:hover {
          background: var(--color-danger-dark, #b91c1c);
        }
      `}</style>
    </div>
  );
}

/**
 * Inline field error
 */
export function FieldError({ message, className = '' }) {
  if (!message) return null;
  
  return (
    <p className={`field-error ${className}`}>
      {message}
      
      <style jsx>{`
        .field-error {
          margin: 0.375rem 0 0 0;
          font-size: 0.8125rem;
          color: var(--color-danger, #dc2626);
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .field-error::before {
          content: '⚠';
          font-size: 0.75rem;
        }
      `}</style>
    </p>
  );
}
