'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SeasonsAdminPage() {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSeasons()
  }, [])

  async function loadSeasons() {
    const { data } = await supabase
      .from('seasons')
      .select(`
        *,
        events(id, name, year, status)
      `)
      .order('year', { ascending: false })

    setSeasons(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading seasons...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Link href="/admin" style={{ color: '#3b82f6', fontSize: 14 }}>← Back to Admin</Link>
          <h1 style={{ marginTop: 8, marginBottom: 0 }}>🏆 Seasons</h1>
        </div>
        <Link
          href="/admin/seasons/new"
          style={{
            padding: '12px 24px',
            background: '#16a34a',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          + New Season
        </Link>
      </div>

      {seasons.length === 0 ? (
        <div style={{
          padding: 48,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h3 style={{ margin: '0 0 8px' }}>No seasons yet</h3>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Create a season to group events together (like Entertainment Awards 2025).
          </p>
          <Link
            href="/admin/seasons/new"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#16a34a',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Create First Season
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {seasons.map(season => (
            <div
              key={season.id}
              style={{
                padding: 20,
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{season.name}</h2>
                  {season.description && (
                    <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14 }}>
                      {season.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#666' }}>
                    <span>📅 {season.year}</span>
                    <span>📊 {season.events?.length || 0} events</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/season/${season.id}/standings`}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    View Standings
                  </Link>
                  <Link
                    href={`/admin/seasons/${season.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#7c3aed',
                      color: 'white',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Manage
                  </Link>
                </div>
              </div>

              {/* Events in this season */}
              {season.events && season.events.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {season.events.map(event => (
                      <span
                        key={event.id}
                        style={{
                          padding: '4px 12px',
                          background: event.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                          color: event.status === 'completed' ? '#166534' : '#374151',
                          borderRadius: 16,
                          fontSize: 13
                        }}
                      >
                        {event.name} {event.status === 'completed' && '✓'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
