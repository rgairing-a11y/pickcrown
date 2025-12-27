'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { Card, PageHeader, Button, EmptyState, LoadingState } from '../../../../../components/ui'
import { sortByOrderIndex, getPoolUrl, copyToClipboard, createMap } from '../../../../../lib/utils'

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

  function handleCopyPoolLink() {
    copyToClipboard(getPoolUrl(poolId), () => alert('Link copied!'))
  }

  if (loading) {
    return <LoadingState message="Loading entries..." />
  }

  if (!pool) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Pool Not Found" />
        <Card>
          <EmptyState
            icon="❌"
            title="Pool not found"
            actionLabel="Back to Admin"
            actionHref="/admin"
          />
        </Card>
      </div>
    )
  }

  const categories = sortByOrderIndex(pool.event?.categories || [])

  // Build lookup maps
  const optionMap = {}
  categories.forEach(cat => {
    cat.options?.forEach(opt => {
      optionMap[opt.id] = opt
    })
  })

  const categoryMap = createMap(categories)

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        title={pool.name}
        subtitle={pool.event?.name}
        actions={
          <Button onClick={handleCopyPoolLink} variant="primary">
            📋 Copy Pool Link
          </Button>
        }
      />

      {/* Stats */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xl)',
          fontSize: 'var(--font-size-md)'
        }}>
          <div>
            <strong style={{ fontSize: 'var(--font-size-xxl)' }}>{entries.length}</strong>
            <span style={{ color: 'var(--color-text-light)', marginLeft: 'var(--spacing-sm)' }}>
              entries
            </span>
          </div>
          <div>
            <strong style={{ fontSize: 'var(--font-size-xxl)' }}>{categories.length}</strong>
            <span style={{ color: 'var(--color-text-light)', marginLeft: 'var(--spacing-sm)' }}>
              categories
            </span>
          </div>
        </div>
      </Card>

      {/* Entries */}
      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon="📭"
            title="No entries yet"
            description="Share the pool link to get started!"
          />
        </Card>
      ) : (
        entries.map(entry => {
          const isExpanded = expandedEntries[entry.id]
          const pickCount = entry.picks?.length || 0

          return (
            <Card
              key={entry.id}
              style={{ marginBottom: 'var(--spacing-md)', padding: 0 }}
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
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEntry(entry.id)
                    }}
                    variant="danger-light"
                    size="sm"
                  >
                    Delete
                  </Button>
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
                        <span style={{
                          color: 'var(--color-text-light)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
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
            </Card>
          )
        })
      )}
    </div>
  )
}