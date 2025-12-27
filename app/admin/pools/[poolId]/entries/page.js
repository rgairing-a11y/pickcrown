'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

export default function PoolEntriesPage({ params }) {
  const [poolId, setPoolId] = useState(null)
  const [pool, setPool] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState({})

  useEffect(() => {
    params.then(p => setPoolId(p.poolId))
  }, [params])

  useEffect(() => {
    if (poolId) loadData()
  }, [poolId])

  async function loadData() {
    const { data: poolData } = await supabase
      .from('pools')
      .select(`
        *,
        event:events (
          name,
          categories (
            id,
            name,
            order_index,
            options:category_options (id, name, is_correct)
          )
        )
      `)
      .eq('id', poolId)
      .single()

    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select(`
        *,
        picks:category_picks (
          category_id,
          option_id
        )
      `)
      .eq('pool_id', poolId)
      .order('created_at')

    setPool(poolData)
    setEntries(entriesData || [])
    setLoading(false)
  }

  function toggleEntry(entryId) {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }))
  }

  async function deleteEntry(entryId) {
    if (!confirm('Delete this entry and all their picks?')) return
    await supabase.from('pool_entries').delete().eq('id', entryId)
    loadData()
  }

  function copyPoolLink() {
    const url = `${window.location.origin}/pool/${poolId}`
    navigator.clipboard.writeText(url)
    alert('Link copied!')
  }

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  if (!pool) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Pool not found</div>
  }

  const categories = pool.event?.categories?.sort((a, b) => a.order_index - b.order_index) || []

  const optionMap = {}
  categories.forEach(cat => {
    cat.options?.forEach(opt => {
      optionMap[opt.id] = opt
    })
  })

  const categoryMap = {}
  categories.forEach(cat => {
    categoryMap[cat.id] = cat
  })

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      {/* Pool Header */}
      <div style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
          <div>
            <h1 style={{ margin: 0 }}>{pool.name}</h1>
            <p style={{ color: 'var(--color-text-light)', margin: 'var(--spacing-sm) 0 0' }}>{pool.event?.name}</p>
          </div>
          <button
            onClick={copyPoolLink}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Copy Pool Link
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-xl)', 
          marginTop: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-light)'
        }}>
          <span><strong>{entries.length}</strong> entries</span>
          <span><strong>{categories.length}</strong> categories</span>
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div style={{
          background: 'var(--color-white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          color: 'var(--color-text-muted)'
        }}>
          No entries yet. Share the pool link to get started!
        </div>
      ) : (
        entries.map(entry => {
          const isExpanded = expandedEntries[entry.id]
          const pickCount = entry.picks?.length || 0

          return (
            <div
              key={entry.id}
              style={{
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 'var(--spacing-md)',
                overflow: 'hidden'
              }}
            >
              {/* Entry Header */}
              <div
                onClick={() => toggleEntry(entry.id)}
                style={{
                  padding: 'var(--spacing-lg)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <span style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    ▶
                  </span>
                  <div>
                    <strong>{entry.entry_name}</strong>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-light)' }}>
                      {entry.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-background-dark)',
                    padding: '2px var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {pickCount}/{categories.length} picks
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEntry(entry.id)
                    }}
                    style={{
                      color: 'var(--color-danger)',
                      background: 'var(--color-danger-light)',
                      border: 'none',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Entry Picks */}
              {isExpanded && (
                <div style={{ 
                  padding: 'var(--spacing-lg)', 
                  background: 'var(--color-background)',
                  borderTop: '1px solid var(--color-border-light)'
                }}>
                  {categories.map(category => {
                    const pick = entry.picks?.find(p => p.category_id === category.id)
                    const pickedOption = pick ? optionMap[pick.option_id] : null
                    const correctOption = category.options?.find(o => o.is_correct)
                    const isCorrect = pickedOption?.is_correct === true

                    return (
                      <div
                        key={category.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--spacing-sm) 0',
                          borderBottom: '1px solid var(--color-border-light)'
                        }}
                      >
                        <span style={{ color: 'var(--color-text-light)', fontSize: 'var(--font-size-sm)' }}>
                          {category.name}
                        </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: correctOption 
                            ? (isCorrect ? 'var(--color-success)' : 'var(--color-danger)')
                            : 'var(--color-text)'
                        }}>
                          {pickedOption?.name || '—'}
                          {correctOption && (isCorrect ? ' ✅' : ' ❌')}
                        </span>
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