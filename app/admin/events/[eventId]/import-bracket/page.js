'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function ImportBracketPage({ params }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error('Missing Supabase environment variables')
      return null
    }
    return createClient(url, key)
  }, [])
  ), [])

  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  // CSV state
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    setEvent(data)
    setLoading(false)
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target.result)
      parseCSV(event.target.result)
    }
    reader.readAsText(file)
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const teams = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue
      
      // Parse: Seed, Team Name, Region (optional)
      const parts = line.split(',').map(p => p.trim())
      
      if (parts.length >= 2) {
        const seed = parseInt(parts[0]) || null
        const name = parts[1]
        const region = parts[2] || null
        
        if (name) {
          teams.push({ seed, name, region, line: i + 1 })
        }
      }
    }

    setPreview({ teams, raw: text })
  }

  function handleTextChange(e) {
    setCsvText(e.target.value)
    if (e.target.value.trim()) {
      parseCSV(e.target.value)
    } else {
      setPreview(null)
    }
  }

  async function handleImport() {
    if (!preview || preview.teams.length === 0) return

    setImporting(true)
    setResult(null)

    try {
      let imported = 0
      let errors = []

      for (const team of preview.teams) {
        const { error } = await supabase
          .from('teams')
          .insert({
            event_id: eventId,
            name: team.name,
            seed: team.seed,
            region: team.region
          })

        if (error) {
          errors.push(`Line ${team.line}: ${error.message}`)
        } else {
          imported++
        }
      }

      setResult({
        success: true,
        imported,
        errors
      })

      // Clear form on success
      if (errors.length === 0) {
        setCsvText('')
        setPreview(null)
      }

    } catch (err) {
      setResult({ error: err.message })
    }

    setImporting(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Link href={`/admin/events/${eventId}/teams`} style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Teams
      </Link>

      <h1 style={{ marginTop: 16 }}>📥 Import Bracket (CSV)</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Import teams from a CSV file for {event.name}
      </p>

      {/* Format Help */}
      <div style={{
        padding: 16,
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd',
        marginBottom: 24
      }}>
        <h4 style={{ margin: '0 0 8px', color: '#0369a1' }}>CSV Format</h4>
        <p style={{ fontSize: 14, color: '#0c4a6e', margin: '0 0 8px' }}>
          One team per line: <code>Seed, Team Name, Region (optional)</code>
        </p>
        <pre style={{ 
          background: '#e0f2fe', 
          padding: 12, 
          borderRadius: 6, 
          fontSize: 13,
          overflow: 'auto',
          margin: 0
        }}>
{`1, Ohio State, Midwest
2, Georgia, South
3, Texas, West
4, Penn State, East
# Lines starting with # are ignored`}
        </pre>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Upload CSV File
        </label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            width: '100%'
          }}
        />
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0', color: '#9ca3af' }}>
        — or paste below —
      </div>

      {/* Text Input */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Paste CSV Data
        </label>
        <textarea
          value={csvText}
          onChange={handleTextChange}
          placeholder={`1, Ohio State, Midwest\n2, Georgia, South\n3, Texas, West`}
          rows={10}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'monospace'
          }}
        />
      </div>

      {/* Preview */}
      {preview && preview.teams.length > 0 && (
        <div style={{
          padding: 16,
          background: '#f9fafb',
          borderRadius: 8,
          marginBottom: 24
        }}>
          <h4 style={{ margin: '0 0 12px' }}>Preview ({preview.teams.length} teams)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                <th style={{ padding: 8, textAlign: 'left', width: 60 }}>Seed</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Team Name</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Region</th>
              </tr>
            </thead>
            <tbody>
              {preview.teams.slice(0, 20).map((team, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 8 }}>{team.seed || '—'}</td>
                  <td style={{ padding: 8 }}>{team.name}</td>
                  <td style={{ padding: 8, color: '#6b7280' }}>{team.region || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.teams.length > 20 && (
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
              ... and {preview.teams.length - 20} more
            </p>
          )}
        </div>
      )}

      {/* Import Button */}
      {preview && preview.teams.length > 0 && !result?.success && (
        <button
          onClick={handleImport}
          disabled={importing}
          style={{
            padding: '12px 24px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: importing ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          {importing ? 'Importing...' : `Import ${preview.teams.length} Teams`}
        </button>
      )}

      {/* Result */}
      {result?.success && (
        <div style={{
          padding: 16,
          background: '#dcfce7',
          borderRadius: 8,
          border: '1px solid #22c55e',
          marginTop: 16
        }}>
          <strong style={{ color: '#166534' }}>✅ Imported {result.imported} teams!</strong>
          
          {result.errors.length > 0 && (
            <div style={{ marginTop: 12, color: '#b91c1c' }}>
              <strong>Errors:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Link
              href={`/admin/events/${eventId}/teams`}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              View Teams →
            </Link>
          </div>
        </div>
      )}

      {result?.error && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          borderRadius: 8,
          color: '#dc2626',
          marginTop: 16
        }}>
          {result.error}
        </div>
      )}
    </div>
  )
}
