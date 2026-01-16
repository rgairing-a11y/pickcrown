'use client'

import { useState } from 'react'
import Link from 'next/link'

// Single entry card component
function EntryCard({ entry, isLocked }) {
  const locked = isLocked(entry.pool?.event?.start_time)
  const event = entry.pool?.event
  
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        background: locked ? '#f8fafc' : '#f0fdf4',
        borderRadius: 8,
        border: `1px solid ${locked ? '#e2e8f0' : '#bbf7d0'}`
      }}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          {entry.pool?.name}
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
          {event?.name}
          <span style={{ marginLeft: 8, color: locked ? '#dc2626' : '#16a34a' }}>
            {locked ? '🔒 Locked' : '🟢 Open'}
          </span>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>
          Entry: {entry.entry_name}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {!locked && (
          <Link
            href={`/pool/${entry.pool?.id}`}
            style={{
              padding: '8px 14px',
              background: '#16a34a',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Enter Picks
          </Link>
        )}
        <Link
          href={`/pool/${entry.pool?.id}/standings`}
          style={{
            padding: '8px 14px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Standings
        </Link>
      </div>
    </div>
  )
}

// Season card with collapsible entries
function SeasonCard({ season, entries, isLocked }) {
  const [expanded, setExpanded] = useState(true)
  
  // Sort entries by event start_time
  const sortedEntries = [...entries].sort((a, b) => {
    const aTime = new Date(a.pool?.event?.start_time || 0)
    const bTime = new Date(b.pool?.event?.start_time || 0)
    return aTime - bTime
  })
  
  // Find next upcoming/open event
  const now = new Date()
  const nextOpenIndex = sortedEntries.findIndex(e => 
    new Date(e.pool?.event?.start_time) > now
  )
  
  // Count locked vs open
  const lockedCount = sortedEntries.filter(e => isLocked(e.pool?.event?.start_time)).length
  const openCount = sortedEntries.length - lockedCount
  
  return (
    <div style={{
      marginBottom: 16,
      border: '2px solid #c4b5fd',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      {/* Season Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: 16,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            🏆 {season.name}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
            {sortedEntries.length} event{sortedEntries.length !== 1 ? 's' : ''}
            {openCount > 0 && <span style={{ marginLeft: 8 }}>• {openCount} open</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href={`/season/${season.id}/standings`}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Season Standings
          </Link>
          <span style={{ fontSize: 20 }}>
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>
      
      {/* Events List */}
      {expanded && (
        <div style={{ padding: 12, background: '#faf5ff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedEntries.map((entry, idx) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                isLocked={isLocked}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EntriesList({ entries, isLocked }) {
  // Group entries by season
  const seasonMap = new Map()
  const noSeasonEntries = []
  
  entries.forEach(entry => {
    const season = entry.pool?.event?.season
    if (season) {
      if (!seasonMap.has(season.id)) {
        seasonMap.set(season.id, {
          season,
          entries: []
        })
      }
      seasonMap.get(season.id).entries.push(entry)
    } else {
      noSeasonEntries.push(entry)
    }
  })
  
  // Convert map to array and sort by earliest event
  const seasonGroups = Array.from(seasonMap.values()).sort((a, b) => {
    const aEarliest = Math.min(...a.entries.map(e => new Date(e.pool?.event?.start_time || 0)))
    const bEarliest = Math.min(...b.entries.map(e => new Date(e.pool?.event?.start_time || 0)))
    return aEarliest - bEarliest
  })
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Season-grouped entries first */}
      {seasonGroups.map(({ season, entries: seasonEntries }) => (
        <SeasonCard
          key={season.id}
          season={season}
          entries={seasonEntries}
          isLocked={isLocked}
        />
      ))}
      
      {/* Non-season entries */}
      {noSeasonEntries.map(entry => (
        <EntryCard 
          key={entry.id} 
          entry={entry} 
          isLocked={isLocked}
        />
      ))}
    </div>
  )
}
