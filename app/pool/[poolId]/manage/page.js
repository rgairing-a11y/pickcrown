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
  
  // Reinvite feature state
  const [otherPools, setOtherPools] = useState([])
  const [selectedTargetPool, setSelectedTargetPool] = useState('')
  const [sendingInvites, setSendingInvites] = useState(false)

  // Delete/Archive state (NEW)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

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

    // Get other pools by same owner (for reinvite feature)
    if (poolData.owner_email) {
      const { data: otherPoolsData } = await supabase
        .from('pools')
        .select('id, name, event:events(name, start_time)')
        .eq('owner_email', poolData.owner_email)
        .neq('id', poolId)
        .order('created_at', { ascending: false })
      
      setOtherPools(otherPoolsData || [])
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

  // NEW: Archive handler
  async function handleArchive(status) {
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/pools/${poolId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': pool?.owner_email || ''
        },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update pool status')
      
      alert(`Pool ${status === 'archived' ? 'archived' : 'unarchived'} successfully`)
      loadPoolData() // Refresh
    } catch (error) {
      console.error('Archive error:', error)
      alert('Failed to update pool status. Please try again.')
    } finally {
      setIsArchiving(false)
    }
  }

  // UPDATED: Delete handler with new API
  async function handleDeletePool() {
    if (!confirm(`Are you sure you want to delete "${pool.name}"?\n\nThis will remove all ${entries.length} entries and cannot be undone.`)) {
      setShowDeleteConfirm(false)
      return
    }
    if (!confirm('This is your last chance. Really delete this pool?')) {
      setShowDeleteConfirm(false)
      return
    }
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pools/${poolId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': pool?.owner_email || ''
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete pool')
      
      alert('Pool deleted successfully')
      window.location.href = '/'
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete pool. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleSendInvites() {
    if (!selectedTargetPool) {
      alert('Please select a pool to invite to')
      return
    }

    if (entries.length === 0) {
      alert('No entries to invite')
      return
    }

    const targetPool = otherPools.find(p => p.id === selectedTargetPool)
    if (!confirm(`Send invites to ${entries.length} people for "${targetPool?.name}"?`)) return

    setSendingInvites(true)

    try {
      const res = await fetch('/api/email/send-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: entries.map(e => e.email),
          targetPoolId: selectedTargetPool
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Sent ${data.sent} invite(s)!${data.skipped ? ` (${data.skipped} skipped in dev mode)` : ''}`)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      alert('Error sending invites: ' + err.message)
    }

    setSendingInvites(false)
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

      {/* NEW: Archive status badge */}
      {pool.status === 'archived' && (
        <p style={{ 
          display: 'inline-block',
          marginLeft: 8,
          padding: '4px 12px', 
          borderRadius: '4px',
          fontSize: '14px',
          background: '#fef3c7',
          color: '#92400e'
        }}>
          📦 Archived
        </p>
      )}

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

      {/* Send Reminder to Incomplete */}
      {!isLocked && incompleteEntries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={async () => {
              if (!confirm(`Send reminder to ${incompleteEntries.length} incomplete entries?`)) return
              
              try {
                const res = await fetch('/api/email/send-reminder-incomplete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    poolId,
                    emails: incompleteEntries.map(e => e.email)
                  })
                })
                const data = await res.json()
                if (data.success) {
                  alert(`Sent ${data.sent} reminder(s)!`)
                } else {
                  alert('Error: ' + data.error)
                }
              } catch (err) {
                alert('Error sending reminders')
              }
            }}
            style={{
              padding: '12px 24px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            📧 Send Reminder to {incompleteEntries.length} Incomplete
          </button>
        </div>
      )}

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

      {/* Reinvite to Another Pool */}
      {entries.length > 0 && otherPools.length > 0 && (
        <div style={{ 
          marginTop: 32, 
          padding: 24, 
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 8 
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#0369a1' }}>
            📨 Reinvite to Another Pool
          </h3>
          <p style={{ color: '#0c4a6e', fontSize: '14px', marginBottom: 16 }}>
            Send invites to all {entries.length} participants for a different pool.
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedTargetPool}
              onChange={(e) => setSelectedTargetPool(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '14px',
                minWidth: 250
              }}
            >
              <option value="">Select a pool...</option>
              {otherPools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.event?.name})
                </option>
              ))}
            </select>
            
            <button
              onClick={handleSendInvites}
              disabled={!selectedTargetPool || sendingInvites}
              style={{
                padding: '10px 20px',
                background: selectedTargetPool ? '#0ea5e9' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: selectedTargetPool ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              {sendingInvites ? 'Sending...' : `Send ${entries.length} Invites`}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone - UPDATED with Archive */}
      <div style={{ 
        marginTop: 48, 
        padding: 24, 
        border: '2px solid #fee2e2',
        borderRadius: 8,
        background: '#fef2f2'
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#dc2626', fontSize: '16px' }}>⚠️ Danger Zone</h3>
        
        {/* Archive/Unarchive Section */}
        <div style={{ 
          marginBottom: 16, 
          padding: 16, 
          background: pool.status === 'archived' ? '#dcfce7' : '#fef3c7',
          border: `1px solid ${pool.status === 'archived' ? '#bbf7d0' : '#fde68a'}`,
          borderRadius: 6 
        }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>
            {pool.status === 'archived' ? '📦 Unarchive Pool' : '📦 Archive Pool'}
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#666' }}>
            {pool.status === 'archived' 
              ? 'Restore this pool to active lists'
              : 'Hide this pool from active lists (can be reversed)'
            }
          </p>
          <button
            onClick={() => handleArchive(pool.status === 'archived' ? 'active' : 'archived')}
            disabled={isArchiving}
            style={{
              padding: '8px 16px',
              background: pool.status === 'archived' ? '#16a34a' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isArchiving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: isArchiving ? 0.5 : 1
            }}
          >
            {isArchiving 
              ? 'Processing...' 
              : (pool.status === 'archived' ? 'Unarchive' : 'Archive')
            }
          </button>
        </div>

        {/* Delete Section */}
        <div>
          <p style={{ color: '#991b1b', fontSize: '14px', marginBottom: 16 }}>
            Deleting a pool removes all entries and picks permanently.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete Pool'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 400,
            width: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 16 }}>
              Confirm Deletion
            </h3>
            <p style={{ marginBottom: 24, color: '#666' }}>
              This will permanently delete <strong>{pool.name}</strong> and all associated entries and picks.
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePool}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}