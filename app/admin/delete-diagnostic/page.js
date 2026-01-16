'use client'

import { useState } from 'react'

export default function DeleteDiagnostic() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [testId, setTestId] = useState('')
  const [testType, setTestType] = useState('pool')

  async function checkConfig() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/delete')
      const data = await res.json()
      setResult({ type: 'config', data })
    } catch (err) {
      setResult({ type: 'error', message: err.message })
    }
    setLoading(false)
  }

  async function testDelete() {
    if (!testId.trim()) {
      alert('Enter an ID first')
      return
    }
    
    if (!confirm(`Really try to delete ${testType} ${testId}?`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/delete?type=${testType}&id=${testId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      setResult({ type: 'delete', data, status: res.status })
    } catch (err) {
      setResult({ type: 'error', message: err.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>🔧 Delete Diagnostic</h1>
      
      <div style={{ 
        background: '#fef3c7', 
        border: '1px solid #f59e0b',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24
      }}>
        <h3 style={{ margin: '0 0 8px' }}>⚠️ Common Issue</h3>
        <p style={{ margin: 0 }}>
          Delete requires <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable in Vercel.
          <br/><br/>
          <strong>To fix:</strong>
          <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>Go to Supabase → Settings → API</li>
            <li>Copy the <strong>service_role</strong> key (NOT anon key)</li>
            <li>Go to Vercel → Settings → Environment Variables</li>
            <li>Add: <code>SUPABASE_SERVICE_ROLE_KEY</code> = [paste key]</li>
            <li>Redeploy your app</li>
          </ol>
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={checkConfig}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16
          }}
        >
          {loading ? 'Checking...' : '1️⃣ Check Configuration'}
        </button>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
        <h3>Test Delete</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select 
            value={testType} 
            onChange={(e) => setTestType(e.target.value)}
            style={{ padding: 8, fontSize: 14 }}
          >
            <option value="pool">Pool</option>
            <option value="event">Event</option>
          </select>
          <input
            type="text"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            placeholder="UUID to delete"
            style={{ flex: 1, padding: 8, fontSize: 14 }}
          />
        </div>
        <button
          onClick={testDelete}
          disabled={loading || !testId.trim()}
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
          {loading ? 'Deleting...' : '2️⃣ Test Delete'}
        </button>
      </div>

      {result && (
        <div style={{ 
          background: result.type === 'error' || result.data?.success === false ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${result.type === 'error' || result.data?.success === false ? '#fca5a5' : '#86efac'}`,
          borderRadius: 8,
          padding: 16
        }}>
          <h3 style={{ margin: '0 0 8px' }}>Result:</h3>
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap', 
            fontSize: 13,
            background: 'white',
            padding: 12,
            borderRadius: 4
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.data?.config?.serviceRoleKey === '❌ Missing SUPABASE_SERVICE_ROLE_KEY' && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#dc2626', 
              color: 'white',
              borderRadius: 4
            }}>
              <strong>🔴 THE SERVICE ROLE KEY IS MISSING!</strong>
              <br/>
              Add SUPABASE_SERVICE_ROLE_KEY to Vercel and redeploy.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
