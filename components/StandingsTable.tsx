'use client'

import { useState } from 'react'
import type { Standing } from '../lib/types'

interface MedalStyle {
  background: string
  borderColor: string
  icon: string
}

interface StandingsTableProps {
  standings?: Standing[]
  showPoints?: boolean
  showMaxPossible?: boolean
  highlightEmail?: string | null
  compact?: boolean
  eventStatus?: 'upcoming' | 'in_progress' | 'completed'
  onEntryClick?: (entry: Standing) => void
}

/**
 * StandingsTable - A refined standings display with better visual hierarchy
 */
export default function StandingsTable({
  standings = [],
  showPoints = true,
  showMaxPossible = false,
  highlightEmail = null,
  compact = false,
  eventStatus = 'in_progress',
  onEntryClick
}: StandingsTableProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  if (!standings || standings.length === 0) {
    return null
  }

  // Medal colors for top 3
  const getMedalStyle = (rank: number | undefined): MedalStyle | null => {
    if (!rank) return null
    switch (rank) {
      case 1:
        return {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderColor: '#f59e0b',
          icon: '🥇'
        }
      case 2:
        return {
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderColor: '#9ca3af',
          icon: '🥈'
        }
      case 3:
        return {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderColor: '#d97706',
          icon: '🥉'
        }
      default:
        return null
    }
  }

  // Determine if on mobile (will use CSS but need for initial render)
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div style={{ width: '100%' }}>
      {/* Desktop Table View */}
      <div className="hide-mobile" style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0
        }}>
          <thead>
            <tr>
              <th style={{
                width: 60,
                textAlign: 'center',
                padding: 'var(--spacing-3) var(--spacing-4)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                borderBottom: '2px solid var(--color-border)',
                background: 'var(--color-background)'
              }}>
                Rank
              </th>
              <th style={{
                textAlign: 'left',
                padding: 'var(--spacing-3) var(--spacing-4)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                borderBottom: '2px solid var(--color-border)',
                background: 'var(--color-background)'
              }}>
                Entry
              </th>
              {showPoints && (
                <th style={{
                  width: 100,
                  textAlign: 'right',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  borderBottom: '2px solid var(--color-border)',
                  background: 'var(--color-background)'
                }}>
                  Points
                </th>
              )}
              {showMaxPossible && (
                <th style={{
                  width: 100,
                  textAlign: 'right',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  borderBottom: '2px solid var(--color-border)',
                  background: 'var(--color-background)'
                }}>
                  Max Possible
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, idx) => {
              const medal = getMedalStyle(entry.rank)
              const isHighlighted = highlightEmail && 
                entry.email?.toLowerCase() === highlightEmail.toLowerCase()
              const isClickable = !!onEntryClick

              return (
                <tr
                  key={entry.email || entry.id || idx}
                  onClick={() => isClickable && onEntryClick(entry)}
                  style={{
                    background: isHighlighted 
                      ? 'var(--color-primary-light)' 
                      : medal?.background || (idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-background)'),
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 150ms ease'
                  }}
                >
                  <td style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--color-border-light)',
                    fontWeight: entry.rank && entry.rank <= 3 ? 'var(--font-bold)' : 'var(--font-normal)'
                  }}>
                    {medal ? (
                      <span style={{ fontSize: '1.25rem' }}>{medal.icon}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>#{entry.rank}</span>
                    )}
                  </td>
                  <td style={{
                    padding: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--color-border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <span style={{
                        fontWeight: entry.rank && entry.rank <= 3 ? 'var(--font-semibold)' : 'var(--font-normal)',
                        color: isHighlighted ? 'var(--color-primary-dark)' : 'var(--color-text)'
                      }}>
                        {entry.entry_name || entry.display_name || 'Anonymous'}
                      </span>
                      {isHighlighted && (
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 8px',
                          background: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  {showPoints && (
                    <td style={{
                      textAlign: 'right',
                      padding: 'var(--spacing-4)',
                      borderBottom: '1px solid var(--color-border-light)',
                      fontWeight: 'var(--font-semibold)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: entry.rank && entry.rank <= 3 ? 'var(--font-size-lg)' : 'var(--font-size-base)'
                    }}>
                      {entry.total_points ?? entry.points ?? 0}
                    </td>
                  )}
                  {showMaxPossible && (
                    <td style={{
                      textAlign: 'right',
                      padding: 'var(--spacing-4)',
                      borderBottom: '1px solid var(--color-border-light)',
                      color: 'var(--color-text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {entry.max_possible ?? '—'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="hide-desktop" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)'
      }}>
        {standings.map((entry, idx) => {
          const medal = getMedalStyle(entry.rank)
          const isHighlighted = highlightEmail && 
            entry.email?.toLowerCase() === highlightEmail.toLowerCase()
          const isExpanded = expandedEntry === entry.email

          return (
            <div
              key={entry.email || entry.id || idx}
              onClick={() => setExpandedEntry(isExpanded ? null : entry.email)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                background: isHighlighted 
                  ? 'var(--color-primary-light)' 
                  : medal?.background || 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: isHighlighted 
                  ? '2px solid var(--color-primary)' 
                  : medal 
                    ? `2px solid ${medal.borderColor}` 
                    : '1px solid var(--color-border-light)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              {/* Rank */}
              <div style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-full)',
                background: medal ? 'rgba(255,255,255,0.5)' : 'var(--color-background)',
                fontWeight: 'var(--font-bold)',
                fontSize: medal ? '1.25rem' : 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                flexShrink: 0
              }}>
                {medal ? medal.icon : entry.rank}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: entry.rank <= 3 ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: isHighlighted ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {entry.entry_name || entry.display_name || 'Anonymous'}
                  {isHighlighted && (
                    <span style={{
                      marginLeft: 'var(--spacing-2)',
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 6px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-full)',
                      verticalAlign: 'middle'
                    }}>
                      You
                    </span>
                  )}
                </div>
                {showMaxPossible && entry.max_possible && (
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: 2
                  }}>
                    Max: {entry.max_possible}
                  </div>
                )}
              </div>

              {/* Points */}
              {showPoints && (
                <div style={{
                  fontWeight: 'var(--font-bold)',
                  fontSize: entry.rank && entry.rank <= 3 ? 'var(--font-size-xl)' : 'var(--font-size-lg)',
                  color: isHighlighted ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {entry.total_points ?? entry.points ?? 0}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 'var(--spacing-4)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        background: 'var(--color-background)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-muted)',
        textAlign: 'center'
      }}>
        {standings.length} {standings.length === 1 ? 'entry' : 'entries'}
        {eventStatus === 'completed' && ' • Final Results'}
        {eventStatus === 'in_progress' && ' • Live'}
      </div>
    </div>
  )
}
