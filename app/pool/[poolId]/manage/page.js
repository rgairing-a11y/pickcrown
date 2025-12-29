'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ManagePoolPage({ params }) {
  const [pool, setPool] = useState(null)
  const [entries, setEntries] = useState([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [poolId, setPoolId] = useState(null)

  useEffect(() => {
    async function unwrapParams() {
      const { poolId } = await params
      setPoolId(poolId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (poolId) {
      loadPoolData()
    }
  }, [poolId])

  async function loadPoolData() {
    setLoading(true)

    // Get pool with event
    const { data: poolData } = await supabase
      .from('pools')
      .select(`
        *,
        event:events(*)
      `)
      .eq('id', poolId)
      .single()

    setPool(poolData)

    if (!poolData) {
      setLoading(false)
      return
    }

    const eventType = poolData.event?.event_type || 'bracket'

    // Get total questions/matchups count
    let questionCount = 0
    if (eventType === 'bracket') {
      const { count } = await supabase
        .from('matchups')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', poolData.event.id)
      questionCount = count || 0
    } else {
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', poolData.event.id)
      questionCount = count || 0
    }
    setTotalQuestions(questionCount)

    // Get entries with pick counts
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select('*')
      .eq('pool_id', poolId)
      .order('created_at', { ascending: false })

    // Get pick counts for each entry
    const entriesWithCounts = await Promise.all(
      (entriesData || []).map(async (entry) => {
        let pickCount = 0
        if (eventType === 'bracket') {
          const { count } = await supabase
            .from('bracket_picks')
            .select('*', { count: 'exact', head: true })
            .eq('pool_entry_id', entry.id)
          pickCount = count || 0
        } else {
          const { count } = await supabase
            .from('category_picks')
            .select('*', { count: 'exact', head: true })
            .eq('pool_entry_id', entry.id)
          pickCount = count || 0
        }
        return { ...entry, pickCount }
      })
    )

    setEntries(entriesWithCounts)
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  const isLocked = new Date(pool.event.start_time) < new Date()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const poolUrl = `${baseUrl}/pool/${poolId}`

  const completeEntries = entries.filter(e => e.pickCount >= totalQuestions)
  const incompleteEntries = entries.filter(e => e.pickCount < totalQuestions)

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 900, 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/pool/${poolId}`} style={{ color: '#3b82f6', fontSize: '14px' }}>
          ← Back to Pool
        </Link>
      </div>

      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>👑 {pool.name}</h1>
      <p style={{ color: '#666', marginBottom: '8px' }}>{pool.event.name}</p>
      <p style={{ 
        display: 'inline-block',
        padding: '4px 12px', 
        borderRadius: '4px',
        fontSize: '14px',
        background: isLocked ? '#fee2e2' : '#dcfce7',
        color: isLocked ? '#dc2626' : '#16a34a'
      }}>
        {isLocked ? '🔒 Locked' : '🟢 Open for picks'}
      </p>

      {/* Share Link */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#f3f4f6', 
        borderRadius: 8 
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>📤 Share This Link</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            readOnly
            value={poolUrl}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px',
              background: 'white'
            }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(poolUrl)
              alert('Link copied!')
            }}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 16, 
        marginTop: 24 
      }}>
        <div style={{ padding: 16, background: '#f3f4f6', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{entries.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Entries</div>
        </div>
        <div style={{ padding: 16, background: '#dcfce7', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{completeEntries.length}</div>
          <div style={{ fontSize: '14px', color: '#166534' }}>Complete</div>
        </div>
        <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{incompleteEntries.length}</div>
          <div style={{ fontSize: '14px', color: '#991b1b' }}>Incomplete</div>
        </div>
      </div>

      {/* Entries Table */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '18px', marginBottom: 16 }}>👥 Entries ({entries.length})</h2>
        
        {entries.length === 0 ? (
          <p style={{ color: '#666' }}>No entries yet. Share the link above!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Entry Name</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Email</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Picks</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Tie Breaker</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isComplete = entry.pickCount >= totalQuestions
                return (
                  <tr key={entry.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                      {entry.entry_name}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', color: '#666' }}>
                      {entry.email}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {isComplete ? (
                        <span style={{ color: '#16a34a' }}>✅ Done</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>⏳ {entry.pickCount}/{totalQuestions}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {entry.pickCount} / {totalQuestions}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#666' }}>
                      {entry.tie_breaker_value || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          href={`/pool/${poolId}`}
          style={{
            padding: '10px 20px',
            background: 'white',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          View Pool
        </Link>
        <Link
          href={`/pool/${poolId}/standings`}
          style={{
            padding: '10px 20px',
            background: 'white',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          View Standings
        </Link>
        {isLocked && (
          <Link
            href={`/pool/${poolId}/picks`}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            View All Picks
          </Link>
        )}
      </div>
    </div>
  )
}