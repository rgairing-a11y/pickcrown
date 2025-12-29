'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PoolEmailsPage() {
  const { poolId } = useParams()
  const [pool, setPool] = useState(null)
  const [emailLog, setEmailLog] = useState([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadPool()
    loadEmailLog()
  }, [poolId])

  async function loadPool() {
    const { data } = await supabase
      .from('pools')
      .select('*, event:events(*), entries:pool_entries(count)')
      .eq('id', poolId)
      .single()
    setPool(data)
  }

  async function loadEmailLog() {
    const { data } = await supabase
      .from('email_log')
      .select('*')
      .eq('pool_id', poolId)
      .order('sent_at', { ascending: false })
    setEmailLog(data || [])
  }

  async function sendReminders() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/email/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId })
      })
      const data = await res.json()
      setResult(data)
      loadEmailLog()
    } catch (err) {
      setResult({ error: err.message })
    }
    setSending(false)
  }

  async function sendResults() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/email/send-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId })
      })
      const data = await res.json()
      setResult(data)
      loadEmailLog()
    } catch (err) {
      setResult({ error: err.message })
    }
    setSending(false)
  }

  if (!pool) return <div style={{ padding: 24 }}>Loading...</div>

  const isLocked = new Date(pool.event.start_time) < new Date()
  const isCompleted = pool.event.status === 'completed'
  const entryCount = pool.entries?.[0]?.count || 0

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Link href={`/admin/pools/${poolId}/edit`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
        ← Back to Pool
      </Link>

      <h1 style={{ marginTop: 16 }}>{pool.name}</h1>
      <p style={{ color: '#666', marginTop: 4 }}>
        {pool.event.name} • {entryCount} entries
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 24, 
        marginTop: 24 
      }}>
        {/* Reminder Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: 12, 
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Reminder Emails</h3>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Remind all pool entries to submit their picks before the deadline.
          </p>
          <button
            onClick={sendReminders}
            disabled={sending || isLocked}
            style={{
              width: '100%',
              background: isLocked ? '#d1d5db' : '#f59e0b',
              color: isLocked ? '#6b7280' : 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {sending ? 'Sending...' : isLocked ? '🔒 Event Started' : 'Send Reminders'}
          </button>
          {isLocked && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
              Can't send reminders after event starts
            </p>
          )}
        </div>

        {/* Results Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: 12, 
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Results Emails</h3>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Send final standings to all participants after event is complete.
          </p>
          <button
            onClick={sendResults}
            disabled={sending || !isCompleted}
            style={{
              width: '100%',
              background: !isCompleted ? '#d1d5db' : '#22c55e',
              color: !isCompleted ? '#6b7280' : 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: !isCompleted ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {sending ? 'Sending...' : !isCompleted ? '⏳ Event Not Complete' : 'Send Results'}
          </button>
          {!isCompleted && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
              Mark event as complete first
            </p>
          )}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: result.error ? '#fef2f2' : '#f0fdf4',
          borderRadius: 8,
          border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`
        }}>
          {result.error ? (
            <p style={{ color: '#dc2626', margin: 0, fontWeight: 500 }}>
              ❌ Error: {result.error}
            </p>
          ) : (
            <div>
              <p style={{ color: '#16a34a', margin: 0, fontWeight: 500 }}>
                ✅ Emails processed successfully
              </p>
              <p style={{ color: '#166534', margin: '8px 0 0 0', fontSize: 14 }}>
                Sent: {result.sent} • Skipped: {result.skipped} • Failed: {result.failed}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Email Log */}
      <h2 style={{ marginTop: 40, marginBottom: 16 }}>📧 Email History</h2>
      
      {emailLog.length === 0 ? (
        <div style={{ 
          background: '#f9fafb', 
          borderRadius: 8, 
          padding: 32, 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p style={{ margin: 0 }}>No emails sent yet</p>
        </div>
      ) : (
        <div style={{ 
          background: 'white', 
          borderRadius: 12, 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Type</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Recipient</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {emailLog.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6,
                      fontSize: 14
                    }}>
                      {log.email_type === 'reminder' ? '⏰' : '🏆'}
                      <span style={{ textTransform: 'capitalize' }}>{log.email_type}</span>
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 14 }}>{log.recipient_email}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: 'inline-block',
                      background: log.status === 'sent' ? '#dcfce7' : '#fee2e2',
                      color: log.status === 'sent' ? '#166534' : '#dc2626',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                    {new Date(log.sent_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
