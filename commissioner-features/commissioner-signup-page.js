'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AVATAR_OPTIONS = [
  { emoji: '👑', label: 'Crown', color: '#f59e0b' },
  { emoji: '🏆', label: 'Trophy', color: '#eab308' },
  { emoji: '⚡', label: 'Lightning', color: '#8b5cf6' },
  { emoji: '🎯', label: 'Bullseye', color: '#ef4444' },
  { emoji: '🦁', label: 'Lion', color: '#f97316' },
  { emoji: '🐻', label: 'Bear', color: '#78716c' },
  { emoji: '🦅', label: 'Eagle', color: '#0ea5e9' },
  { emoji: '🐺', label: 'Wolf', color: '#6b7280' },
  { emoji: '🚀', label: 'Rocket', color: '#3b82f6' },
  { emoji: '💎', label: 'Diamond', color: '#06b6d4' },
  { emoji: '🔥', label: 'Fire', color: '#f97316' },
  { emoji: '⭐', label: 'Star', color: '#fbbf24' },
  { emoji: '🏈', label: 'Football', color: '#854d0e' },
  { emoji: '⚽', label: 'Soccer', color: '#16a34a' },
  { emoji: '🏀', label: 'Basketball', color: '#ea580c' },
  { emoji: '🎬', label: 'Movies', color: '#1f2937' }
]

export default function CommissionerSignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [bio, setBio] = useState('')
  
  // Check for existing email in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pickcrown_email')
    if (saved) {
      setEmail(saved)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/commissioners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          avatar_emoji: selectedAvatar.emoji,
          avatar_color: selectedAvatar.color,
          bio: bio.trim() || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create commissioner account')
      }

      // Save email to localStorage
      localStorage.setItem('pickcrown_email', email.toLowerCase().trim())
      
      // Also create/update profile
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          display_name: name.trim(),
          avatar_emoji: selectedAvatar.emoji,
          avatar_color: selectedAvatar.color,
          is_commissioner: true,
          commissioner_id: data.id
        })
      })

      // Success! Move to step 3
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Email & Name
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-8)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>👑</div>
            <h1 style={{ 
              fontSize: 'var(--font-size-3xl)', 
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--spacing-2)'
            }}>
              Become a Commissioner
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Create and manage prediction pools for your friends, family, or coworkers.
            </p>
          </div>

          {/* Benefits */}
          <div style={{
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)'
          }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-sm)', 
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--spacing-3)',
              color: 'var(--color-text-secondary)'
            }}>
              COMMISSIONER BENEFITS
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              fontSize: 'var(--font-size-sm)'
            }}>
              <li style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-2)'
              }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span>
                Create unlimited pools
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-2)'
              }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span>
                Dashboard to manage all your pools
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-2)'
              }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span>
                Your name & avatar on your pools
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)'
              }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span>
                Priority support
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-2)',
                fontWeight: 'var(--font-medium)',
                fontSize: 'var(--font-size-sm)'
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
                  padding: 'var(--spacing-3)',
                  fontSize: 'var(--font-size-lg)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-2)',
                fontWeight: 'var(--font-medium)',
                fontSize: 'var(--font-size-sm)'
              }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Commissioner Name"
                required
                style={{
                  width: '100%',
                  padding: 'var(--spacing-3)',
                  fontSize: 'var(--font-size-lg)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
              <p style={{ 
                fontSize: 'var(--font-size-xs)', 
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-1)'
              }}>
                This will be shown on your pools
              </p>
            </div>

            <button
              type="submit"
              disabled={!email.trim() || !name.trim()}
              style={{
                width: '100%',
                padding: 'var(--spacing-4)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-semibold)',
                background: (!email.trim() || !name.trim()) ? 'var(--color-text-muted)' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: (!email.trim() || !name.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Continue →
            </button>
          </form>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 'var(--spacing-6)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)'
          }}>
            Already a commissioner?{' '}
            <Link href="/" style={{ color: '#7c3aed', fontWeight: 'var(--font-medium)' }}>
              Go to Dashboard
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 2: Avatar Selection
  if (step === 2) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-8)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              ← Back
            </button>
            <h1 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--spacing-2)'
            }}>
              Choose Your Avatar
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              This will represent you on your pools
            </p>
          </div>

          {/* Preview */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spacing-6)',
            padding: 'var(--spacing-4)',
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: selectedAvatar.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto var(--spacing-2)'
            }}>
              {selectedAvatar.emoji}
            </div>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>{name}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Commissioner
            </div>
          </div>

          {/* Avatar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-6)'
          }}>
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.emoji}
                onClick={() => setSelectedAvatar(avatar)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-lg)',
                  background: avatar.color,
                  border: selectedAvatar.emoji === avatar.emoji 
                    ? '3px solid #7c3aed' 
                    : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                  transform: selectedAvatar.emoji === avatar.emoji ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>

          {/* Bio (Optional) */}
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--spacing-2)',
              fontWeight: 'var(--font-medium)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Short Bio <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Office pool champion 3 years running!"
              maxLength={140}
              rows={2}
              style={{
                width: '100%',
                padding: 'var(--spacing-3)',
                fontSize: 'var(--font-size-base)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                resize: 'none'
              }}
            />
            <p style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--color-text-muted)',
              textAlign: 'right',
              marginTop: 'var(--spacing-1)'
            }}>
              {bio.length}/140
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 'var(--spacing-3)',
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-4)',
              fontSize: 'var(--font-size-sm)'
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: 'var(--spacing-4)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-semibold)',
              background: loading ? 'var(--color-text-muted)' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Commissioner Account'}
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Success
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-6)',
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-8)',
        boxShadow: 'var(--shadow-xl)',
        textAlign: 'center'
      }}>
        {/* Success Animation */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'var(--color-success-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          margin: '0 auto var(--spacing-6)'
        }}>
          ✅
        </div>

        <h1 style={{ 
          fontSize: 'var(--font-size-2xl)', 
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--spacing-2)'
        }}>
          Welcome, Commissioner!
        </h1>
        <p style={{ 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-6)'
        }}>
          Your account has been created. You're ready to start pools!
        </p>

        {/* Avatar Preview */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-4)',
          padding: 'var(--spacing-4)',
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--spacing-6)'
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: selectedAvatar.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem'
          }}>
            {selectedAvatar.emoji}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--font-size-lg)' }}>
              {name}
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: '#7c3aed',
              fontWeight: 'var(--font-medium)'
            }}>
              👑 Commissioner
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Link
            href="/"
            style={{
              display: 'block',
              padding: 'var(--spacing-4)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-semibold)',
              background: '#7c3aed',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              textAlign: 'center'
            }}
          >
            🚀 Start Your First Pool
          </Link>
          <Link
            href="/commissioner/dashboard"
            style={{
              display: 'block',
              padding: 'var(--spacing-3)',
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              textAlign: 'center'
            }}
          >
            Go to Commissioner Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
