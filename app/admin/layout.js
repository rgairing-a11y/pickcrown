'use client'

import { useState, useEffect } from 'react'

export default function AdminLayout({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already authorized
    const saved = localStorage.getItem('pickcrown_admin')
    if (saved === 'true') {
      setIsAuthorized(true)
    }
    setChecking(false)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('pickcrown_admin', 'true')
      setIsAuthorized(true)
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  function handleLogout() {
    localStorage.removeItem('pickcrown_admin')
    setIsAuthorized(false)
  }

  if (checking) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!isAuthorized) {
    return (
      <div style={{ 
        maxWidth: 400, 
        margin: '48px auto', 
        padding: 24,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: 8 }}>🔒 Admin Access</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Enter the admin password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 6,
              marginBottom: 16,
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <p style={{ color: '#dc3545', marginBottom: 16 }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              fontWeight: 'bold',
              background: '#1a1a2e',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      {/* Admin Header Bar */}
      <div style={{
        background: '#1a1a2e',
        padding: '8px 24px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: -16,
        marginRight: -16,
        marginTop: -48,
        paddingTop: 16
      }}>
        <span style={{ color: 'white', fontWeight: 'bold' }}>
          🔐 Admin Mode
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  )
}