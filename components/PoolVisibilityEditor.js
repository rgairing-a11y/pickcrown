// Pool Visibility Editor Component
// Add this to your pool manage page

import { useState } from 'react'

export function PoolVisibilityEditor({ pool, supabase, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [openDate, setOpenDate] = useState(pool.open_date ? pool.open_date.slice(0, 16) : '')
  const [archiveDate, setArchiveDate] = useState(pool.archive_date ? pool.archive_date.slice(0, 16) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    
    const { error } = await supabase
      .from('pools')
      .update({
        open_date: openDate || null,
        archive_date: archiveDate || null
      })
      .eq('id', pool.id)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      setEditing(false)
      if (onUpdate) onUpdate()
    }
    
    setSaving(false)
  }

  // Calculate current visibility status
  const now = new Date()
  const isVisible = (!pool.open_date || new Date(pool.open_date) <= now) &&
                    (!pool.archive_date || new Date(pool.archive_date) > now) &&
                    pool.status !== 'archived'

  const getStatusText = () => {
    if (pool.status === 'archived') return 'Manually archived'
    if (pool.open_date && new Date(pool.open_date) > now) {
      return `Opens ${new Date(pool.open_date).toLocaleDateString()}`
    }
    if (pool.archive_date && new Date(pool.archive_date) < now) {
      return `Auto-archived ${new Date(pool.archive_date).toLocaleDateString()}`
    }
    if (pool.archive_date) {
      return `Visible until ${new Date(pool.archive_date).toLocaleDateString()}`
    }
    return 'Always visible'
  }

  if (!editing) {
    return (
      <div style={{
        padding: 16,
        background: isVisible ? '#f0fdf4' : '#fef3c7',
        borderRadius: 8,
        border: `1px solid ${isVisible ? '#bbf7d0' : '#fcd34d'}`,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>
              📅 Visibility Window
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isVisible ? '#22c55e' : '#f59e0b',
                marginRight: 6
              }}></span>
              {getStatusText()}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '6px 12px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: 16,
      background: '#f9fafb',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      marginBottom: 16
    }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
        📅 Visibility Window
      </h4>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Opens On (leave empty for immediate)
          </label>
          <input
            type="datetime-local"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Auto-Archive After (leave empty for never)
          </label>
          <input
            type="datetime-local"
            value={archiveDate}
            onChange={(e) => setArchiveDate(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
        Pool will be visible on dashboards between these dates. 
        Participants can still access via direct link anytime.
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => {
            setEditing(false)
            setOpenDate(pool.open_date ? pool.open_date.slice(0, 16) : '')
            setArchiveDate(pool.archive_date ? pool.archive_date.slice(0, 16) : '')
          }}
          style={{
            padding: '8px 16px',
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Usage in manage page:
// <PoolVisibilityEditor pool={pool} supabase={supabase} onUpdate={loadPool} />
