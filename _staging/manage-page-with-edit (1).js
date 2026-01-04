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

  // Edit entry state
  const [editingEntry, setEditingEntry] = useState(null)
  const [editForm, setEditForm] = useState({ entry_name: '', email: '' })

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

  // UPDATED: Delete handler with admin API
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
      const response = await fetch(`/api/admin/delete?type=pool&id=${poolId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('Delete errors:', data.errors)
        alert('Failed to delete pool:\n' + (data.errors?.join('\n') || data.error || 'Unknown error'))
        return
      }
      
      alert('Pool deleted successfully')
      window.location.href = '/'
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete pool: ' + error.message)
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

  // Entry editing handlers
  function openEditModal(entry) {
    setEditingEntry(entry)
    setEditForm({ 
      entry_name: entry.entry_name || '', 
      email: entry.email || '' 
    })
  }

  async function handleSaveEntry() {
    if (!editingEntry) return
    
    if (!editForm.entry_name.trim()) {
      alert('Entry name is required')
      return
    }
    if (!editForm.email.trim() || !editForm.email.includes('@')) {
      alert('Valid email is required')
      return
    }

    try {
      const { error } = await supabase
        .from('pool_entries')
        .update({ 
          entry_name: editForm.entry_name.trim(),
          email: editForm.email.trim().toLowerCase()
        })
        .eq('id', editingEntry.id)

      if (error) throw error

      // Update local state immediately
      setEntries(prev => prev.map(e => 
        e.id === editingEntry.id 
          ? { ...e, entry_name: editForm.entry_name.trim(), email: editForm.email.trim().toLowerCase() }
          : e
      ))
      
      setEditingEntry(null)
    } catch (err) {
      alert('Failed to update: ' + err.message)
    }
  }

  async function handleDeleteEntry(entry) {
    if (!confirm(`Delete entry "${entry.entry_name}"?\n\nThis will remove all their picks and cannot be undone.`)) {
      return
    }

    try {
      // Delete picks first (foreign key constraint)
      await supabase.from('bracket_picks').delete().eq('pool_entry_id', entry.id)
      await supabase.from('category_picks').delete().eq('pool_entry_id', entry.id)
      
      // Delete entry
      const { error } = await supabase.from('pool_entries').delete().eq('id', entry.id)
      if (error) throw error

      alert('Entry deleted')
      loadPoolData()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
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

      {/* Entry Completion Nudge - friendly, aggregate, no names */}
      {!isLocked && entries.length > 0 && (
        <div style={{ 
          marginTop: 24,
          padding: 20,
          background: completeEntries.length === entries.length 
            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
            : incompleteEntries.length <= 2 
              ? '#fef9c3' 
              : '#f3f4f6',
          borderRadius: 12,
          border: completeEntries.length === entries.length 
            ? '2px solid #22c55e'
            : '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700,
                color: completeEntries.length === entries.length ? '#16a34a' : '#374151'
              }}>
                {completeEntries.length} of {entries.length} submitted
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                {completeEntries.length === entries.length 
                  ? "🎉 Everyone's in! Ready to go."
                  : completeEntries.length === 0
                    ? "Waiting for picks to come in..."
                    : incompleteEntries.length === 1
                      ? "Almost there – just 1 more to go!"
                      : incompleteEntries.length <= 3
                        ? `Just waiting on a few more picks.`
                        : `${incompleteEntries.length} still thinking it over.`
                }
              </div>
            </div>
            {/* Progress ring */}
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                />
                <circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke={completeEntries.length === entries.length ? '#22c55e' : '#3b82f6'}
                  strokeWidth="6"
                  strokeDasharray={`${(completeEntries.length / entries.length) * 163} 163`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600
              }}>
                {Math.round((completeEntries.length / entries.length) * 100)}%
              </div>
            </div>
          </div>
        </div>
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

      {/* Pool Notes (Commissioner-Only Editable) */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#fef9c3', 
        borderRadius: 8,
        border: '1px solid #fcd34d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>📝 Pool Notes</h3>
          <span style={{ fontSize: 12, color: '#92400e' }}>Visible to all participants</span>
        </div>
        <textarea
          value={pool.notes || ''}
          onChange={(e) => setPool({ ...pool, notes: e.target.value })}
          placeholder="Add notes for your pool (e.g., 'Loser buys pizza', 'House rules: no upsets allowed')"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: '14px',
            minHeight: 60,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={async () => {
            try {
              const { error } = await supabase
                .from('pools')
                .update({ notes: pool.notes })
                .eq('id', poolId)
              if (error) throw error
              alert('Notes saved!')
            } catch (err) {
              alert('Failed to save notes: ' + err.message)
            }
          }}
          style={{
            marginTop: 8,
            padding: '8px 16px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Save Notes
        </button>
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
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
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
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <button
                        onClick={() => openEditModal(entry)}
                        style={{
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          marginRight: 4
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        🗑️
                      </button>
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

      {/* Edit Entry Modal */}
      {editingEntry && (
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
            borderRadius: 12,
            maxWidth: 450,
            width: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 20 }}>
              ✏️ Edit Entry
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                Entry Name
              </label>
              <input
                type="text"
                value={editForm.entry_name}
                onChange={(e) => setEditForm({ ...editForm, entry_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditingEntry(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}