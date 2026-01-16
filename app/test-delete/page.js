'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DeleteTestPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteType, setDeleteType] = useState('pool')
  const [deleteId, setDeleteId] = useState('')
  const [result, setResult] = useState(null)

  async function checkConfig() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/delete')
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      setConfig({ error: err.message })
    }
    setLoading(false)
  }

  async function doDelete() {
    if (!deleteId.trim()) {
      alert('Enter an ID')
      return
    }
    if (!confirm(`DELETE ${deleteType} ${deleteId}?`)) return
    if (!confirm('This is permanent. Really delete?')) return

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/delete?type=${deleteType}&id=${deleteId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      setResult({ status: res.status, ...data })
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>🔧 Delete Test</h1>
      
      <Link href="/" style={{ color: '#3b82f6' }}>← Back to Home</Link>

      {/* Warning Box */}
      <div style={{ 
        background: '#fef3c7', 
        border: '2px solid #f59e0b',
        borderRadius: 8,
        padding: 16,
        margin: '24px 0'
      }}>
        <h3 style={{ margin: '0 0 8px' }}>⚠️ Required Setup</h3>
        <p style={{ margin: 0, fontSize: 14 }}>
          Delete requires <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel.
        </p>
        <ol style={{ margin: '12px 0 0', paddingLeft: 20, fontSize: 14 }}>
          <li>Supabase → Settings → API → Copy <strong>service_role</strong> key</li>
          <li>Vercel → Settings → Environment Variables → Add it</li>
          <li>Redeploy</li>
        </ol>
      </div>

      {/* Step 1: Check Config */}
      <div style={{ marginBottom: 32 }}>
        <h2>Step 1: Check Configuration</h2>
        <button
          onClick={checkConfig}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          {loading ? 'Checking...' : 'Check Config'}
        </button>

        {config && (
          <pre style={{ 
            background: '#f3f4f6', 
            padding: 16, 
            borderRadius: 8, 
            marginTop: 12,
            fontSize: 13,
            overflow: 'auto'
          }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        )}

        {config?.config?.serviceRoleKey === '❌ Missing SUPABASE_SERVICE_ROLE_KEY' && (
          <div style={{ 
            background: '#dc2626', 
            color: 'white', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 12 
          }}>
            <strong>🔴 SERVICE ROLE KEY NOT SET!</strong><br/>
            Add it to Vercel and redeploy.
          </div>
        )}

        {config?.config?.serviceRoleKey === '✅ Set' && (
          <div style={{ 
            background: '#16a34a', 
            color: 'white', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 12 
          }}>
            ✅ Service role key is configured! Delete should work.
          </div>
        )}
      </div>

      {/* Step 2: Test Delete */}
      <div style={{ marginBottom: 32 }}>
        <h2>Step 2: Test Delete</h2>
        
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <select
            value={deleteType}
            onChange={(e) => setDeleteType(e.target.value)}
            style={{ padding: 10, fontSize: 14, borderRadius: 6 }}
          >
            <option value="pool">Pool</option>
            <option value="event">Event</option>
          </select>
          
          <input
            type="text"
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            placeholder="UUID to delete"
            style={{ flex: 1, padding: 10, fontSize: 14, borderRadius: 6, border: '1px solid #ddd' }}
          />
        </div>

        <button
          onClick={doDelete}
          disabled={loading || !deleteId.trim()}
          style={{
            padding: '12px 24px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16
          }}
        >
          {loading ? 'Deleting...' : `Delete ${deleteType}`}
        </button>

        {result && (
          <pre style={{ 
            background: result.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
            padding: 16, 
            borderRadius: 8, 
            marginTop: 12,
            fontSize: 13,
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>

      {/* How to find IDs */}
      <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 8px' }}>How to find pool/event IDs</h3>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
          Pool IDs are in the URL: <code>/pool/abc123...</code><br/>
          Event IDs: Check Supabase dashboard → events table
        </p>
      </div>
    </div>
  )
}
