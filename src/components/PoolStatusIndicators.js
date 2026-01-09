// components/PoolStatusIndicators.js
// Entry count context and results completion indicators

'use client';

/**
 * EntryCount - Shows aggregate entry count for pool (per roadmap: aggregate only, no individual status)
 * 
 * @param {number} count - Number of entries
 * @param {number} invited - Number invited (optional)
 * @param {boolean} isLocked - Whether picks are locked
 */
export function EntryCount({ 
  count = 0, 
  invited = null, 
  isLocked = false,
  className = '',
}) {
  // Don't show if no entries
  if (count === 0 && !invited) return null;
  
  return (
    <div className={`entry-count ${className}`}>
      <span className="count-icon">👥</span>
      <span className="count-text">
        {invited ? (
          <>
            <strong>{count}</strong> of {invited} {isLocked ? 'entered' : 'submitted'}
          </>
        ) : (
          <>
            <strong>{count}</strong> {count === 1 ? 'entry' : 'entries'}
          </>
        )}
      </span>
      
      <style jsx>{`
        .entry-count {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          background: var(--color-bg-secondary, #f9fafb);
          border-radius: 20px;
          font-size: 0.875rem;
          color: var(--color-text-muted, #6b7280);
        }

        .count-icon {
          font-size: 0.9375rem;
        }

        .count-text strong {
          color: var(--color-text, #1f2937);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

/**
 * ResultsStatus - Indicates results completion state
 * 
 * @param {string} status - 'pending' | 'partial' | 'complete'
 * @param {number} entered - Results entered
 * @param {number} total - Total results needed
 * @param {string} completedAt - When results were finalized
 */
export function ResultsStatus({
  status = 'pending',
  entered = 0,
  total = 0,
  completedAt,
  className = '',
}) {
  const config = {
    pending: {
      icon: '⏳',
      label: 'Awaiting Results',
      description: 'Results will be entered after the event',
      color: 'var(--color-text-muted, #6b7280)',
      bgColor: 'var(--color-bg-secondary, #f9fafb)',
    },
    partial: {
      icon: '📊',
      label: 'Results In Progress',
      description: `${entered} of ${total} results entered`,
      color: 'var(--color-warning-text, #92400e)',
      bgColor: 'var(--color-warning-light, #fef3c7)',
    },
    complete: {
      icon: '✓',
      label: 'All Results Final',
      description: completedAt 
        ? `Finalized ${new Date(completedAt).toLocaleDateString()}`
        : 'All results have been entered',
      color: 'var(--color-success-text, #166534)',
      bgColor: 'var(--color-success-light, #dcfce7)',
    },
  };

  const current = config[status] || config.pending;

  return (
    <div 
      className={`results-status ${status} ${className}`}
      style={{ 
        '--status-color': current.color,
        '--status-bg': current.bgColor,
      }}
    >
      <span className="status-icon">{current.icon}</span>
      <div className="status-content">
        <span className="status-label">{current.label}</span>
        <span className="status-description">{current.description}</span>
      </div>

      <style jsx>{`
        .results-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: var(--status-bg);
          border-radius: 10px;
          color: var(--status-color);
        }

        .status-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .results-status.complete .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-success, #22c55e);
          color: white;
          border-radius: 50%;
          font-size: 0.875rem;
        }

        .status-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .status-label {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .status-description {
          font-size: 0.8125rem;
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline version of results status
 */
export function ResultsStatusBadge({
  status = 'pending',
  className = '',
}) {
  const config = {
    pending: { icon: '⏳', label: 'Pending', color: '#6b7280' },
    partial: { icon: '📊', label: 'In Progress', color: '#f59e0b' },
    complete: { icon: '✓', label: 'Final', color: '#22c55e' },
  };

  const current = config[status] || config.pending;

  return (
    <span 
      className={`results-badge ${status} ${className}`}
      style={{ '--badge-color': current.color }}
    >
      <span className="badge-icon">{current.icon}</span>
      {current.label}

      <style jsx>{`
        .results-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--badge-color);
          background: color-mix(in srgb, var(--badge-color) 15%, transparent);
        }

        .badge-icon {
          font-size: 0.6875rem;
        }

        .results-badge.complete .badge-icon {
          color: white;
          background: var(--badge-color);
          border-radius: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.5rem;
        }
      `}</style>
    </span>
  );
}

/**
 * PoolHeader combines status information in one component
 */
export function PoolStatusHeader({
  pool,
  event,
  entryCount = 0,
  resultsStatus = 'pending',
  resultsEntered = 0,
  resultsTotal = 0,
  isLocked = false,
}) {
  const lockTime = event?.lock_time || event?.start_time;
  const isComplete = event?.status === 'completed';
  
  return (
    <div className="pool-status-header">
      <div className="status-row">
        <EntryCount 
          count={entryCount} 
          isLocked={isLocked}
        />
        
        {isLocked && (
          <ResultsStatusBadge status={resultsStatus} />
        )}
      </div>

      {!isLocked && lockTime && (
        <LockCountdown lockTime={lockTime} />
      )}

      {isComplete && resultsStatus === 'complete' && (
        <ResultsStatus 
          status="complete"
          completedAt={event.completed_at}
        />
      )}

      <style jsx>{`
        .pool-status-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .status-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

/**
 * Lock countdown indicator
 */
export function LockCountdown({ lockTime, className = '' }) {
  const lock = new Date(lockTime);
  const now = new Date();
  
  if (now >= lock) {
    return (
      <div className={`lock-indicator locked ${className}`}>
        <span className="lock-icon">🔒</span>
        <span className="lock-text">Picks are locked</span>
        
        <style jsx>{`
          .lock-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
            color: var(--color-text-muted, #6b7280);
          }

          .lock-icon {
            font-size: 0.9375rem;
          }
        `}</style>
      </div>
    );
  }

  const diff = lock - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeText;
  let urgency = 'normal';

  if (days > 0) {
    timeText = `${days} day${days !== 1 ? 's' : ''}, ${hours}h`;
  } else if (hours > 0) {
    timeText = `${hours}h ${minutes}m`;
    if (hours < 6) urgency = 'warning';
  } else {
    timeText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    urgency = 'urgent';
  }

  return (
    <div className={`lock-countdown ${urgency} ${className}`}>
      <span className="countdown-icon">⏰</span>
      <span className="countdown-text">
        Picks close in <strong>{timeText}</strong>
      </span>
      
      <style jsx>{`
        .lock-countdown {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .lock-countdown.normal {
          background: var(--color-bg-secondary, #f3f4f6);
          color: var(--color-text-muted, #6b7280);
        }

        .lock-countdown.warning {
          background: var(--color-warning-light, #fef3c7);
          color: var(--color-warning-text, #92400e);
        }

        .lock-countdown.urgent {
          background: var(--color-danger-light, #fef2f2);
          color: var(--color-danger-text, #991b1b);
        }

        .countdown-icon {
          font-size: 1rem;
        }

        .countdown-text strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

/**
 * Event completion celebration (shown after results are final)
 */
export function EventComplete({
  eventName,
  winners = [],
  totalEntries = 0,
}) {
  return (
    <div className="event-complete">
      <div className="complete-header">
        <span className="complete-icon">🏆</span>
        <div className="complete-text">
          <h3 className="complete-title">{eventName} - Complete</h3>
          <p className="complete-subtitle">All results are final</p>
        </div>
      </div>

      {winners.length > 0 && (
        <div className="winners-section">
          <div className="podium">
            {winners.slice(0, 3).map((winner, i) => (
              <div key={i} className={`podium-place place-${i + 1}`}>
                <span className="place-medal">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <span className="place-name">{winner.name}</span>
                <span className="place-score">{winner.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalEntries > 0 && (
        <p className="entries-note">
          {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} competed
        </p>
      )}

      <style jsx>{`
        .event-complete {
          background: linear-gradient(
            135deg,
            var(--color-success-light, #dcfce7) 0%,
            var(--color-bg-secondary, #f9fafb) 100%
          );
          border: 1px solid var(--color-success-border, #bbf7d0);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .complete-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .complete-icon {
          font-size: 2rem;
        }

        .complete-text {
          text-align: left;
        }

        .complete-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text, #1f2937);
        }

        .complete-subtitle {
          margin: 0.125rem 0 0 0;
          font-size: 0.875rem;
          color: var(--color-success-text, #166534);
        }

        .winners-section {
          margin: 1.25rem 0;
        }

        .podium {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .podium-place {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          min-width: 80px;
        }

        .place-1 {
          order: 2;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .place-2 {
          order: 1;
        }

        .place-3 {
          order: 3;
        }

        .place-medal {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .place-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-text, #1f2937);
        }

        .place-score {
          font-size: 0.75rem;
          color: var(--color-text-muted, #6b7280);
        }

        .entries-note {
          margin: 1rem 0 0 0;
          font-size: 0.8125rem;
          color: var(--color-text-muted, #6b7280);
        }
      `}</style>
    </div>
  );
}
