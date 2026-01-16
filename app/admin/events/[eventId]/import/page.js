'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ImportCategoriesPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    const res = await fetch(`/api/events?id=${eventId}`)
    const data = await res.json()
    setEvent(Array.isArray(data) ? data[0] : data)
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const categories = {}

    for (const line of lines) {
      // Skip header row if present
      if (line.toLowerCase().startsWith('category')) continue

      const [categoryName, optionName] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      
      if (!categoryName || !optionName) continue

      if (!categories[categoryName]) {
        categories[categoryName] = []
      }
      categories[categoryName].push(optionName)
    }

    return Object.entries(categories).map(([name, options], index) => ({
      name,
      options,
      order_index: index + 1
    }))
  }

  function handlePreview() {
    const parsed = parseCSV(csvText)
    setPreview(parsed)
    setResult(null)
  }

  async function handleImport() {
    if (!preview || preview.length === 0) return

    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/categories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          categories: preview
        })
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          type: 'success',
          message: `Imported ${data.categoriesCreated} categories with ${data.optionsCreated} options!`
        })
        setCsvText('')
        setPreview(null)
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Import failed'
        })
      }
    } catch (err) {
      setResult({
        type: 'error',
        message: 'Error: ' + err.message
      })
    }

    setImporting(false)
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target.result)
      setPreview(null)
      setResult(null)
    }
    reader.readAsText(file)
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Link href={`/admin/events/${eventId}/categories`} style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Categories
      </Link>

      <h1 style={{ marginTop: 16 }}>Import Categories</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{event.name} ({event.year})</p>

      {/* Instructions */}
      <div style={{ 
        padding: 20, 
        background: '#f0f9ff', 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>📋 CSV Format</h3>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#0369a1' }}>
          Each row should have: <code>Category Name, Option Name</code>
        </p>
        <pre style={{ 
          background: 'white', 
          padding: 12, 
          borderRadius: 6, 
          fontSize: 13,
          overflow: 'auto'
        }}>
{`Best Picture, Anora
Best Picture, The Brutalist
Best Picture, A Complete Unknown
Best Director, Sean Baker
Best Director, Brady Corbet
Best Actor, Adrien Brody
Best Actor, Timothée Chalamet`}
        </pre>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          fontWeight: 600,
          fontSize: 14 
        }}>
          Upload CSV File
        </label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          style={{
            padding: 12,
            border: '2px dashed #d1d5db',
            borderRadius: 8,
            width: '100%',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Or paste */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          fontWeight: 600,
          fontSize: 14 
        }}>
          Or Paste CSV Text
        </label>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value)
            setPreview(null)
            setResult(null)
          }}
          placeholder="Best Picture, Anora&#10;Best Picture, The Brutalist&#10;..."
          rows={10}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 14,
            fontFamily: 'monospace',
            border: '1px solid #d1d5db',
            borderRadius: 8
          }}
        />
      </div>

      {/* Preview Button */}
      <button
        onClick={handlePreview}
        disabled={!csvText.trim()}
        style={{
          padding: '12px 24px',
          background: csvText.trim() ? '#3b82f6' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: csvText.trim() ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          marginRight: 12
        }}
      >
        Preview Import
      </button>

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Preview ({preview.length} categories)</h3>
          
          <div style={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #e5e7eb', 
            borderRadius: 8 
          }}>
            {preview.map((cat, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: 16, 
                  borderBottom: '1px solid #e5e7eb',
                  background: idx % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                <h4 style={{ margin: '0 0 8px', color: '#1f2937' }}>
                  {cat.order_index}. {cat.name}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cat.options.map((opt, optIdx) => (
                    <span
                      key={optIdx}
                      style={{
                        padding: '4px 12px',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: 16,
                        fontSize: 13
                      }}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                padding: '14px 32px',
                background: importing ? '#9ca3af' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: importing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 16
              }}
            >
              {importing ? 'Importing...' : `Import ${preview.length} Categories`}
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: '14px 24px',
                background: 'white',
                color: '#666',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          background: result.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: result.type === 'success' ? '#166534' : '#dc2626'
        }}>
          <strong>{result.message}</strong>
          {result.type === 'success' && (
            <div style={{ marginTop: 12 }}>
              <Link 
                href={`/admin/events/${eventId}/categories`}
                style={{ color: '#166534', fontWeight: 600 }}
              >
                View Categories →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
