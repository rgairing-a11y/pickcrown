'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { Card, PageHeader, Button, EmptyState, LoadingState, Alert } from '../../../../../components/ui'
import { sortByOrderIndex } from '../../../../../lib/utils'
import SendResultsSection from '../../../../../components/SendResultsSection'

export default function AdminResultsPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [pools, setPools] = useState([])  // ADD THIS
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Bulk mode state
  const [pendingResults, setPendingResults] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Clone event state
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneYear, setCloneYear] = useState('')
  const [cloneName, setCloneName] = useState('')
  const [cloneStartTime, setCloneStartTime] = useState('')
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        categories (
          *,
          options:category_options (*)
        )
      `)
      .eq('id', eventId)
      .single()

    if (data) {
      setEvent(data)
      
      const initial = {}
      data.categories?.forEach(cat => {
        const correct = cat.options?.find(o => o.is_correct)
        if (correct) {
          initial[cat.id] = correct.id
        }
      })
      setPendingResults(initial)
    }

    // FETCH POOLS FOR THIS EVENT - ADD THIS
    const { data: poolsData } = await supabase
      .from('pools')
      .select('id, name')
      .eq('event_id', eventId)
    
    setPools(poolsData || [])

    setLoading(false)
  }

  function handleSelectResult(categoryId, optionId) {
    setPendingResults(prev => ({
      ...prev,
      [categoryId]: optionId
    }))
    setHasUnsavedChanges(true)
  }

  async function handleSaveAll() {
    if (Object.keys(pendingResults).length === 0) {
      alert('No results to save')
      return
    }

    setSaving(true)

    try {
      for (const [categoryId, optionId] of Object.entries(pendingResults)) {
        const res = await fetch('/api/results', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, optionId })
        })

        if (!res.ok) {
          const err = await res.json()
          alert('Error saving: ' + err.error)
          setSaving(false)
          return
        }
      }

      setHasUnsavedChanges(false)
      await loadEvent()
      alert('All results saved!')
    } catch (err) {
      alert('Error: ' + err.message)
    }

    setSaving(false)
  }

  async function handleMarkComplete() {
    const confirmed = window.confirm('Mark this event as completed? This will finalize all standings.')
    if (!confirmed) return
    
    setSaving(true)
    
    const res = await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, status: 'completed' })
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
    }
    
    await loadEvent()
    setSaving(false)
  }

  async function handleCloneEvent() {
    if (!cloneYear) {
      alert('Please enter a year')
      return
    }

    setCloning(true)

    try {
      const res = await fetch('/api/events/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          newYear: parseInt(cloneYear),
          newName: cloneName || undefined,
          newStartTime: cloneStartTime || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Cloned! Created "${data.event.name}" with ${data.categoriesCloned} categories.`)
        setShowCloneModal(false)
        window.location.href = `/admin/events/${data.event.id}/results`
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }

    setCloning(false)
  }

  if (loading) {
    return <LoadingState message="Loading event..." />
  }

  if (!event) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Event Not Found" />
        <Card>
          <EmptyState
            icon="❌"
            title="Event not found"
            actionLabel="Back to Admin"
            actionHref="/admin"
          />
        </Card>
      </div>
    )
  }

  const categories = sortByOrderIndex(event.categories || [])
  const totalCategories = categories.length
  const answeredCount = Object.keys(pendingResults).length
  const allAnswered = answeredCount === totalCategories

  return (
    <div style={{ maxWidth: 700 }}>
      <PageHeader 
        title="Enter Results" 
        subtitle={event.name}
      />

      {/* Progress indicator */}
      <Card style={{ marginBottom: 'var(--spacing-lg)', background: '#f0f9ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>{answeredCount}</strong> of <strong>{totalCategories}</strong> results selected
            {hasUnsavedChanges && (
              <span style={{ color: '#f59e0b', marginLeft: 12 }}>• Unsaved changes</span>
            )}
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || !hasUnsavedChanges}
            variant="primary"
          >
            {saving ? 'Saving...' : 'Save All Results'}
          </Button>
        </div>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No categories yet"
            description="Add categories before entering results"
            actionLabel="Add Categories"
            actionHref={'/admin/events/' + eventId + '/categories'}
          />
        </Card>
      ) : (
        categories.map((category, idx) => {
          const selectedOptionId = pendingResults[category.id]
          const savedCorrect = category.options?.find(o => o.is_correct)
          const isChanged = selectedOptionId && savedCorrect?.id !== selectedOptionId
          
          return (
            <Card key={category.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ margin: 0 }}>
                  {idx + 1}. {category.name}
                </h3>
                {selectedOptionId && (
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '2px 8px', 
                    borderRadius: 4,
                    background: isChanged ? '#fef3c7' : '#dcfce7',
                    color: isChanged ? '#92400e' : '#166534'
                  }}>
                    {isChanged ? 'Changed' : 'Saved'}
                  </span>
                )}
              </div>
              
              <select
                value={selectedOptionId || ''}
                onChange={(e) => handleSelectResult(category.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  marginBottom: 'var(--spacing-md)',
                  background: selectedOptionId ? '#f0fdf4' : 'white'
                }}
              >
                <option value="">-- Select winner --</option>
                {category.options?.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: '14px', color: '#666' }}>
                {category.options?.map(option => (
                  <label 
                    key={option.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '6px 0',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name={'category_' + category.id}
                      checked={selectedOptionId === option.id}
                      onChange={() => handleSelectResult(category.id, option.id)}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ 
                      fontWeight: selectedOptionId === option.id ? 'bold' : 'normal',
                      color: selectedOptionId === option.id ? '#16a34a' : '#666'
                    }}>
                      {option.name}
                      {selectedOptionId === option.id && ' ✓'}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          )
        })
      )}

      {/* Sticky Save Bar */}
      {hasUnsavedChanges && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          gap: 16
        }}>
          <span style={{ color: '#666', alignSelf: 'center' }}>
            {answeredCount}/{totalCategories} selected
          </span>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            variant="primary"
            style={{ minWidth: 200 }}
          >
            {saving ? 'Saving...' : 'Save All Results'}
          </Button>
        </div>
      )}

      {/* Clone Event Section */}
      <Card style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ margin: '0 0 var(--spacing-md)' }}>📋 Clone Event</h3>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-md)', fontSize: '14px' }}>
          Create a copy of this event for next year with all categories and options (no results).
        </p>
        
        {!showCloneModal ? (
          <Button onClick={() => {
            setCloneYear((event.year + 1).toString())
            setCloneName(event.name.replace(event.year.toString(), (event.year + 1).toString()))
            setShowCloneModal(true)
          }}>
            Clone to Next Year
          </Button>
        ) : (
          <div style={{ 
            padding: 'var(--spacing-lg)', 
            background: '#f9fafb', 
            borderRadius: 8 
          }}>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '14px' }}>
                New Event Name
              </label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder={event.name}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '14px' }}>
                Year *
              </label>
              <input
                type="number"
                value={cloneYear}
                onChange={(e) => setCloneYear(e.target.value)}
                placeholder="2026"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '14px' }}>
                New Start Time (optional)
              </label>
              <input
                type="datetime-local"
                value={cloneStartTime}
                onChange={(e) => setCloneStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Leave blank to keep same date/time
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={handleCloneEvent}
                disabled={cloning || !cloneYear}
                variant="primary"
              >
                {cloning ? 'Cloning...' : 'Create Clone'}
              </Button>
              <Button
                onClick={() => setShowCloneModal(false)}
                disabled={cloning}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Mark Complete Section */}
      <Card style={{ 
        marginTop: 'var(--spacing-xl)', 
        textAlign: 'center',
        background: event.status === 'completed' ? 'var(--color-success-light)' : 'var(--color-white)'
      }}>
        {event.status === 'completed' ? (
          <div style={{ 
            padding: 'var(--spacing-md)',
            color: 'var(--color-success-dark)',
            fontWeight: 'bold'
          }}>
            ✓ Event Completed
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
              Once all results are entered, mark the event as complete to finalize standings.
            </p>
            <Button
              onClick={handleMarkComplete}
              disabled={saving || hasUnsavedChanges}
              variant="primary"
            >
              {hasUnsavedChanges ? 'Save results first' : 'Mark Event Complete'}
            </Button>
          </div>
        )}
      </Card>

      {/* SEND RESULTS EMAILS SECTION - ADD THIS */}
      <SendResultsSection 
        eventId={eventId} 
        eventName={event?.name}
        isCompleted={event?.status === 'completed'}
        pools={pools}
      />

      {/* Spacer for sticky bar */}
      {hasUnsavedChanges && <div style={{ height: 80 }} />}
    </div>
  )
}