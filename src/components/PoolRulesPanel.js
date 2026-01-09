// components/PoolRulesPanel.js
// Read-only panel displaying pool rules and information

'use client';

import { useState } from 'react';

/**
 * PoolRulesPanel - Displays pool information in a collapsible panel
 * 
 * @param {Object} pool - Pool object with name, notes, etc.
 * @param {Object} event - Event object with name, scoring info
 * @param {boolean} defaultExpanded - Start expanded?
 * @param {string} className - Additional CSS classes
 */
export default function PoolRulesPanel({
  pool,
  event,
  defaultExpanded = false,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Build rules content from pool/event data
  const hasNotes = pool?.notes && pool.notes.trim().length > 0;
  const hasScoring = event?.scoring || event?.rounds?.length > 0;
  
  // Don't render if no content
  if (!hasNotes && !hasScoring && !pool?.rules) {
    return null;
  }

  return (
    <div className={`rules-panel ${isExpanded ? 'expanded' : ''} ${className}`}>
      <button 
        className="rules-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="rules-content"
      >
        <span className="rules-icon">📋</span>
        <span className="rules-label">About This Pool</span>
        <span className="rules-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>
      
      {isExpanded && (
        <div id="rules-content" className="rules-content">
          {/* Pool Notes/Rules */}
          {hasNotes && (
            <section className="rules-section">
              <h4 className="section-title">Commissioner Notes</h4>
              <div className="section-content notes-content">
                {pool.notes.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </section>
          )}

          {/* Scoring Information */}
          {hasScoring && (
            <section className="rules-section">
              <h4 className="section-title">Scoring</h4>
              <div className="section-content">
                {event.rounds?.length > 0 ? (
                  <table className="scoring-table">
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>Points per Correct Pick</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.rounds
                        .sort((a, b) => a.round_order - b.round_order)
                        .map(round => (
                          <tr key={round.id}>
                            <td>{round.name}</td>
                            <td>{round.points}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : event.scoring ? (
                  <p>{event.scoring}</p>
                ) : (
                  <p>Standard scoring applies</p>
                )}
              </div>
            </section>
          )}

          {/* Categories Scoring */}
          {event.categories?.length > 0 && (
            <section className="rules-section">
              <h4 className="section-title">Category Picks</h4>
              <div className="section-content">
                <p className="scoring-note">
                  {event.categories[0]?.points || 1} point{event.categories[0]?.points !== 1 ? 's' : ''} per correct pick
                </p>
                <p className="category-count">
                  {event.categories.length} categories total
                </p>
              </div>
            </section>
          )}

          {/* General Rules */}
          <section className="rules-section">
            <h4 className="section-title">General Rules</h4>
            <ul className="general-rules">
              <li>Picks lock at the deadline shown above</li>
              <li>Ties share the same rank</li>
              <li>Have fun and good luck! 🎉</li>
            </ul>
          </section>
        </div>
      )}

      <style jsx>{`
        .rules-panel {
          background: var(--color-bg-secondary, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 10px;
          overflow: hidden;
          margin: 1rem 0;
        }

        .rules-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          color: var(--color-text, #1f2937);
          font-size: 0.9375rem;
          font-weight: 500;
          transition: background 0.15s ease;
        }

        .rules-toggle:hover {
          background: var(--color-bg-tertiary, #f3f4f6);
        }

        .rules-icon {
          font-size: 1rem;
        }

        .rules-label {
          flex: 1;
        }

        .rules-chevron {
          font-size: 0.75rem;
          opacity: 0.5;
        }

        .rules-content {
          border-top: 1px solid var(--color-border, #e5e7eb);
          padding: 1rem;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rules-section {
          margin-bottom: 1.25rem;
        }

        .rules-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #6b7280);
        }

        .section-content {
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--color-text, #374151);
        }

        .notes-content p {
          margin: 0 0 0.5rem 0;
        }

        .notes-content p:last-child {
          margin-bottom: 0;
        }

        .scoring-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .scoring-table th,
        .scoring-table td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .scoring-table th {
          font-weight: 600;
          color: var(--color-text-muted, #6b7280);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .scoring-table tr:last-child td {
          border-bottom: none;
        }

        .scoring-note {
          margin: 0;
        }

        .category-count {
          margin: 0.25rem 0 0 0;
          font-size: 0.8125rem;
          color: var(--color-text-muted, #6b7280);
        }

        .general-rules {
          margin: 0;
          padding-left: 1.25rem;
        }

        .general-rules li {
          margin-bottom: 0.375rem;
          color: var(--color-text-muted, #6b7280);
          font-size: 0.875rem;
        }

        .general-rules li:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function PoolRulesInline({ pool, event }) {
  if (!pool?.notes) return null;
  
  return (
    <div className="rules-inline">
      <span className="rules-inline-icon">📋</span>
      <span className="rules-inline-text">{pool.notes}</span>
      
      <style jsx>{`
        .rules-inline {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--color-info-light, #eff6ff);
          border-radius: 8px;
          font-size: 0.875rem;
          color: var(--color-info-text, #1e40af);
          line-height: 1.5;
        }
        
        .rules-inline-icon {
          flex-shrink: 0;
        }
        
        .rules-inline-text {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
