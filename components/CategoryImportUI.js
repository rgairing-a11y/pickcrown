'use client'

import { useState, useRef } from 'react'

/**
 * CategoryImportUI - Full UI for importing categories via CSV
 * 
 * Expected CSV format:
 * Category Name,Option 1,Option 2,Option 3,...
 * 
 * Or alternatively:
 * Category Name,Option Name
 * Category Name,Option Name
 * ...
 * 
 * @param {string} eventId - Event to import categories for
 * @param {function} onImportComplete - Callback after successful import
 * @param {function} onClose - Close the import modal
 */
export default function CategoryImportUI({
  eventId,
  onImportComplete,
  onClose
}) {
  const [step, setStep] = useState('upload') // 'upload' | 'preview' | 'importing' | 'complete'
  const [csvText, setCsvText] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  // Parse CSV text
  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const categories = {}

    for (const line of lines) {
      // Parse CSV line (handle quoted fields)
      const fields = parseCSVLine(line)
      
      if (fields.length < 2) continue

      const categoryName = fields[0].trim()
      
      // Check if this is "Category,Option" format or "Category,Opt1,Opt2,..." format
      if (fields.length === 2) {
        // Two-column format: each row is one option
        const optionName = fields[1].trim()
        if (!categories[categoryName]) {
          categories[categoryName] = []
        }
        if (optionName && !categories[categoryName].includes(optionName)) {
          categories[categoryName].push(optionName)
        }
      } else {
        // Multi-column format: all options in one row
        const options = fields.slice(1).map(o => o.trim()).filter(Boolean)
        categories[categoryName] = options
      }
    }

    // Convert to array format
    return Object.entries(categories).map(([name, options], idx) => ({
      name,
      options,
      order: idx + 1
    }))
  }

  // Parse a single CSV line (handles quoted fields)
  function parseCSVLine(line) {
    const fields = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current)

    return fields.map(f => f.replace(/^"|"$/g, '').trim())
  }

  // Handle file upload
  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      setCsvText(text)
      handlePreview(text)
    }
    reader.readAsText(file)
  }

  // Handle paste/manual entry
  function handlePreview(text = csvText) {
    setError('')
    
    try {
      const parsed = parseCSV(text)
      
      if (parsed.length === 0) {
        setError('No valid categories found in CSV')
        return
      }

      // Validate
      for (const cat of parsed) {
        if (!cat.name) {
          setError('Found category with empty name')
          return
        }
        if (cat.options.length === 0) {
          setError(`Category "${cat.name}" has no options`)
          return
        }
      }

      setParsedData(parsed)
      setStep('preview')
    } catch (err) {
      setError('Error parsing CSV: ' + err.message)
    }
  }

  // Import the categories
  async function handleImport() {
    setStep('importing')
    setError('')

    try {
      const res = await fetch('/api/categories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          categories: parsedData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResult(data)
      setStep('complete')
      
      if (onImportComplete) {
        onImportComplete(data)
      }
    } catch (err) {
      setError(err.message)
      setStep('preview')
    }
  }

  // Remove a category from preview
  function removeCategory(idx) {
    setParsedData(prev => prev.filter((_, i) => i !== idx))
  }

  // Remove an option from a category
  function removeOption(catIdx, optIdx) {
    setParsedData(prev => prev.map((cat, i) => {
      if (i === catIdx) {
        return {
          ...cat,
          options: cat.options.filter((_, j) => j !== optIdx)
        }
      }
      return cat
    }))
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)',
      padding: 'var(--spacing-6)'
    }}>
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: 640,
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--spacing-5) var(--spacing-6)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-semibold)'
            }}>
              📥 Import Categories
            </h2>
            <p style={{ 
              margin: 'var(--spacing-1) 0 0', 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)'
            }}>
              Bulk add categories and options from CSV
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--font-size-2xl)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 'var(--spacing-1)',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--spacing-6)'
        }}>
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div>
              {/* Format Help */}
              <div style={{
                background: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--spacing-2)',
                  color: 'var(--color-primary-dark)'
                }}>
                  CSV Format
                </h3>
                <p style={{ 
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  <strong>Option A:</strong> One option per row
                </p>
                <pre style={{
                  background: 'white',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  overflow: 'auto',
                  marginBottom: 'var(--spacing-3)'
                }}>
{`Best Picture,The Brutalist
Best Picture,Conclave
Best Picture,Emilia Pérez
Best Director,Brady Corbet
Best Director,Denis Villeneuve`}
                </pre>
                <p style={{ 
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  <strong>Option B:</strong> All options in one row
                </p>
                <pre style={{
                  background: 'white',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  overflow: 'auto'
                }}>
{`Best Picture,The Brutalist,Conclave,Emilia Pérez,Anora
Best Director,Brady Corbet,Denis Villeneuve,Sean Baker`}
                </pre>
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-6)',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-background)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📄</div>
                  <div style={{ fontWeight: 'var(--font-semibold)' }}>
                    Click to upload CSV file
                  </div>
                  <div style={{ 
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)'
                  }}>
                    or drag and drop
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
              </div>

              {/* Paste Text */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-2)',
                  fontWeight: 'var(--font-medium)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Paste CSV content directly
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 'var(--spacing-4)',
                  padding: 'var(--spacing-3)',
                  background: 'var(--color-danger-light)',
                  color: 'var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div>
              <div style={{
                background: 'var(--color-success-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-4)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-success-dark)'
              }}>
                ✓ Found {parsedData.length} categories with {parsedData.reduce((sum, c) => sum + c.options.length, 0)} total options
              </div>

              {/* Preview List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {parsedData.map((category, catIdx) => (
                  <div
                    key={catIdx}
                    style={{
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Category Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      background: 'var(--color-background)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)'
                      }}>
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-bold)'
                        }}>
                          {catIdx + 1}
                        </span>
                        <span style={{ fontWeight: 'var(--font-semibold)' }}>
                          {category.name}
                        </span>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)'
                        }}>
                          ({category.options.length} options)
                        </span>
                      </div>
                      <button
                        onClick={() => removeCategory(catIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Options */}
                    <div style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-2)'
                      }}>
                        {category.options.map((option, optIdx) => (
                          <span
                            key={optIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-1)',
                              padding: 'var(--spacing-1) var(--spacing-3)',
                              background: 'var(--color-background)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-sm)'
                            }}
                          >
                            {option}
                            <button
                              onClick={() => removeOption(catIdx, optIdx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1,
                                fontSize: 'var(--font-size-sm)'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 'var(--spacing-4)',
                  padding: 'var(--spacing-3)',
                  background: 'var(--color-danger-light)',
                  color: 'var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: 'var(--spacing-4)',
                animation: 'pulse 1s infinite'
              }}>
                ⏳
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Importing categories...
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>
                ✅
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Import Complete!</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-4)' }}>
                Successfully imported {importResult?.categories_created || parsedData.length} categories 
                with {importResult?.options_created || parsedData.reduce((sum, c) => sum + c.options.length, 0)} options.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-6)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'upload' || step === 'preview') && (
          <div style={{
            padding: 'var(--spacing-4) var(--spacing-6)',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 'var(--spacing-3)'
          }}>
            {step === 'upload' && (
              <>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePreview()}
                  disabled={!csvText.trim()}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-3)',
                    background: !csvText.trim() ? 'var(--color-text-muted)' : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: !csvText.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-semibold)'
                  }}
                >
                  Preview →
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={parsedData.length === 0}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-3)',
                    background: parsedData.length === 0 ? 'var(--color-text-muted)' : 'var(--color-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: parsedData.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-semibold)'
                  }}
                >
                  Import {parsedData.length} Categories
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
