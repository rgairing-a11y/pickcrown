'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CommissionerSignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Pre-fill email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/commissioners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to sign up')
        setSubmitting(false)
        return
      }

      // Save email to localStorage
      localStorage.setItem('pickcrown_email', email.toLowerCase().trim())
      
      setSuccess(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          maxWidth: 440,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>You're a Commissioner!</h1>
          <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
            Welcome aboard, <strong>{name}</strong>!<br />
            You can now create and manage pools for your friends.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            Start Creating Pools →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Become a Commissioner</h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6 }}>
            Run prediction pools for your friends, family, or coworkers.
            It's free and takes 30 seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: 12,
              marginBottom: 20,
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600,
              fontSize: 14 
            }}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              required
              style={{
                width: '100%',
                padding: 14,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600,
              fontSize: 14 
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: 14,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8
              }}
            />
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              This is how we'll identify you and your pools.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              fontWeight: 600,
              background: submitting ? '#9ca3af' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginBottom: 16
            }}
          >
            {submitting ? 'Signing up...' : 'Sign Up as Commissioner'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
            Already signed up?{' '}
            <Link href="/" style={{ color: '#3b82f6' }}>
              Go to your pools →
            </Link>
          </p>
        </form>

        <div style={{ 
          marginTop: 32, 
          paddingTop: 24, 
          borderTop: '1px solid #e5e7eb',
          fontSize: 14,
          color: '#666'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#333' }}>
            What commissioners can do:
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Create pools for any upcoming event</li>
            <li>Share invite links with friends</li>
            <li>Track who has submitted picks</li>
            <li>Send reminder emails</li>
            <li>View results and standings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
