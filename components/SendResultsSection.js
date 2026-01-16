'use client'

import { useState } from 'react'

/**
 * SendResultsSection Component
 * 
 * Allows admin to send results emails after event is completed.
 * Includes event podium preview and send functionality.
 */
export default function SendResultsSection({ eventId, eventName, isCompleted, pools = [] }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSendResults() {
    if (!isCompleted) {
      alert('Please mark the event as completed before sending results.')
      return
    }

    const poolCount = pools.length
    const confirmed = window.confirm(
      `Send results emails to all participants in ${poolCount} pool${poolCount !== 1 ? 's' : ''}?\n\n` +
      `This will:\n` +
      `• Email each participant their score and rank\n` +
      `• Include the pool champion\n` +
      `• Show the Top 3 across all pools (Event Podium)\n\n` +
      `Emails are deduplicated — users in multiple pools only receive one email.`
    )

    if (!confirmed) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/email/send-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          type: 'success',
          message: `Sent ${data.sent} results email${data.sent !== 1 ? 's' : ''}!`,
          details: {
            sent: data.sent,
            skipped: data.skipped || 0,
            deduplicated: data.deduplicated || 0,
            podiumEntries: data.podiumEntries || 0
          }
        })
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to send emails'
        })
      }
    } catch (err) {
      setResult({
        type: 'error',
        message: 'Error: ' + err.message
      })
    }

    setSending(false)
  }

  return (
    <div style={{
      padding: 24,
      background: isCompleted ? '#f0fdf4' : '#f9fafb',
      borderRadius: 12,
      border: isCompleted ? '1px solid #86efac' : '1px solid #e5e7eb',
      marginTop: 32
    }}>
      <h3 style={{ 
        margin: '0 0 8px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        color: isCompleted ? '#166534' : '#374151'
      }}>
        📧 Results Emails
      </h3>
      
      <p style={{ 
        color: isCompleted ? '#166534' : '#6b7280', 
        fontSize: 14, 
        marginBottom: 16 
      }}>
        {isCompleted 
          ? 'Event is complete. Send results emails to all participants.'
          : 'Mark the event as completed to send results emails.'
        }
      </p>

      {/* What will be sent */}
      <div style={{
        background: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14
      }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#374151' }}>
          Each email includes:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6b7280' }}>
          <li>Participant's score and rank</li>
          <li>Pool champion announcement</li>
          <li>Link to full standings</li>
          <li>🏆 Event Podium (Top 3 across all pools)</li>
        </ul>
      </div>

      {/* Pool count */}
      {pools.length > 0 && (
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
          <strong>{pools.length}</strong> pool{pools.length !== 1 ? 's' : ''} will receive results.
        </p>
      )}

      {/* Result message */}
      {result && (
        <div style={{
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          background: result.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: result.type === 'success' ? '#166534' : '#dc2626'
        }}>
          <strong>{result.message}</strong>
          {result.details && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <div>✉️ Sent: {result.details.sent}</div>
              {result.details.skipped > 0 && (
                <div>⏭️ Skipped (dev mode): {result.details.skipped}</div>
              )}
              {result.details.deduplicated > 0 && (
                <div>🔄 Deduplicated: {result.details.deduplicated}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSendResults}
        disabled={!isCompleted || sending}
        style={{
          padding: '12px 24px',
          background: isCompleted ? '#22c55e' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: isCompleted ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          fontSize: 14,
          opacity: sending ? 0.7 : 1
        }}
      >
        {sending ? 'Sending...' : '📨 Send Results to All Participants'}
      </button>

      {!isCompleted && (
        <p style={{ 
          marginTop: 12, 
          fontSize: 13, 
          color: '#9ca3af',
          fontStyle: 'italic'
        }}>
          Complete all results and mark event as completed first.
        </p>
      )}
    </div>
  )
}
