'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FeedbackPage() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email })
      })

      if (res.ok) {
        setSent(true)
      } else {
        alert('Error sending feedback. Please try again.')
      }
    } catch (err) {
      alert('Error sending feedback. Please try again.')
    }

    setSending(false)
  }

  if (sent) {
    return (
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: 16 }}>🙏</h1>
        <h2>Thank you for your feedback!</h2>
        <p style={{ color: '#666' }}>We appreciate you taking the time to help improve PickCrown.</p>
        <Link href="/" style={{ color: '#3b82f6', marginTop: 24, display: 'inline-block' }}>
          ← Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: 8 }}>💡 Feedback & Ideas</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Have a suggestion, found a bug, or just want to say hi? We'd love to hear from you!
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Your Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            required
            rows={6}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Your Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #d1d5db',
              borderRadius: 8
            }}
          />
          <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
            Only if you'd like a response
          </p>
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          style={{
            width: '100%',
            padding: 14,
            fontSize: 16,
            fontWeight: 600,
            background: message.trim() ? '#3b82f6' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: message.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
        <Link href="/" style={{ color: '#3b82f6', fontSize: 14 }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}