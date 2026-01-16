'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RecentPools() {
  const [recentPools, setRecentPools] = useState([])

  useEffect(() => {
    // Get recent pools from localStorage
    const stored = localStorage.getItem('pickcrown_recent_pools')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentPools(parsed.slice(0, 3)) // Show max 3
      } catch (e) {
        console.error('Error parsing recent pools:', e)
      }
    }
  }, [])

  if (recentPools.length === 0) {
    return null
  }

  return (
    <div style={{
      marginBottom: 32,
      padding: 24,
      background: '#fffbeb',
      borderRadius: 12,
      border: '1px solid #fde68a'
    }}>
      <h2 style={{ fontSize: 20, marginBottom: 16, color: '#d97706' }}>
        ⚡ Your Recent Pools
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recentPools.map(pool => (
          <div
            key={pool.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: 'white',
              borderRadius: 8
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{pool.name}</span>
              <span style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>
                as {pool.entryName}
              </span>
            </div>
            <Link
              href={`/pool/${pool.id}/standings`}
              style={{
                padding: '6px 12px',
                background: '#d97706',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13
              }}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}