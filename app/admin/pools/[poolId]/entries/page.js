'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

export default function PoolEntriesPage({ params }) {
  const [poolId, setPoolId] = useState(null)
  const [pool, setPool] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEntry, setExpandedEntry] = useState(null)

  useEffect(() => {
    params.then(p => {
      setPoolId(p.poolId)
    })
  }, [params])

  useEffect(() => {
    if (poolId) {
      loadData()
    }
  }, [poolId])

  async function loadData() {
    // Fetch pool with event and categories
    const { data: poolData } = await supabase
      .from('pools')
      .select(`
        *,
        event:events (
          *,
          categories (
            *,
            options:category_options (*)
          )
        )
      `)
      .eq('id', poolId)
      .single()

    // Fetch entries with their picks
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select(`
        *,
        picks:category_picks (
          *,
          option:category_options (*)
        )
      `)
      .eq('pool_id', poolId)
      .order('created_at', { ascending: true })

    setPool(poolData)
    setEntries(entriesData || [])
    setLoading(false)
  }

  async function handleDeleteEntry(entryId) {
    if (!confirm('Delete this entry and all their picks?')) return
    
    await supabase.from('pool_entries').delete().eq('id', entryId)
    loadData()
  }

  function copyPoolLink() {
    const url = `${window.location.origin}/pool/${poolId}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  const categories = pool.event?.categories?.sort((a, b) => 
    a.order_index - b.order_index
  ) || []

  const isLocked = new Date(pool.event?.start_time) < new Date()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: '#0070f3' }}>
          ← Back to Admin
        </Link>
      </div>

      {/* Pool Header */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: 24
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          <div>
            <h1 style={{ margin: 0 }}>{pool.name}</h1>
            <p style={{ color: '#666', margin: '8px 0 0' }}>
              {pool.event?.name} ({pool.event?.year})
            </p>
          </div>
          <button
            onClick={copyPoolLink}
            style={{ 
              fontSize: 14, 
              color: '#0070f3', 
              background: '#f0f7ff',
              border: 'none', 
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Copy Pool Link
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 24, 
          marginTop: 16,
          padding: 16,
          background: '#f9f9f9',
          borderRadius: 8
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{entries.length}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Entries</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{categories.length}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Categories</div>
          </div>
          <div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 'bold',
              color: isLocked ? '#dc3545' : '#28a745'
            }}>
              {isLocked ? '🔒' : '🟢'}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {isLocked ? 'Locked' : 'Open for picks'}
            </div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <h2 style={{ marginBottom: 16 }}>Entries ({entries.length})</h2>

      {entries.length === 0 ? (
        <div style={{
          background: 'white',
          padding: 48,
          borderRadius: 12,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', margin: 0 }}>
            No entries yet. Share the pool link to get picks!
          </p>
        </div>
      ) : (
        entries.map((entry, idx) => {
          const isExpanded = expandedEntry === entry.id
          
          // Build a map of category_id -> picked option
          const pickMap = {}
          entry.picks?.forEach(pick => {
            pickMap[pick.category_id] = pick.option
          })

          return (
            <div 
              key={entry.id}
              style={{
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: 12,
                overflow: 'hidden'
              }}
            >
              {/* Entry Header */}
              <div 
                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: isExpanded ? '1px solid #eee' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ 
                    fontSize: 14,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    ▶
                  </span>
                  <div>
                    <strong style={{ fontSize: 16 }}>
                      #{idx + 1} {entry.entry_name}
                    </strong>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {entry.email}
                    </div>
                  </div>
                </div>
                <div 
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span style={{ fontSize: 13, color: '#666' }}>
                    {entry.picks?.length || 0}/{categories.length} picks
                  </span>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    style={{ 
                      fontSize: 13, 
                      color: '#dc3545', 
                      background: '#fff5f5',
                      border: 'none', 
                      padding: '6px 12px',
                      borderRadius: 4,
                      cursor: 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Entry Picks (Expanded) */}
              {isExpanded && (
                <div style={{ padding: 16, background: '#fafafa' }}>
                  {categories.map(category => {
                    const pickedOption = pickMap[category.id]
                    const correctOption = category.options?.find(o => o.is_correct)
                    const isCorrect = pickedOption && correctOption && pickedOption.id === correctOption.id

                    return (
                      <div 
                        key={category.id}
                        style={{
                          padding: 12,
                          background: 'white',
                          borderRadius: 6,
                          marginBottom: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {category.name}
                          </div>
                          <div style={{ fontWeight: 'bold' }}>
                            {pickedOption ? pickedOption.name : '(no pick)'}
                          </div>
                        </div>
                        {correctOption && (
                          <span style={{
                            fontSize: 18
                          }}>
                            {isCorrect ? '✅' : '❌'}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}