'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { Card, PageHeader, Button, EmptyState, LoadingState, Alert } from '../../../../../components/ui'
import { sortByOrderIndex } from '../../../../../lib/utils'
import SendResultsSection from '../../../../../components/SendResultsSection'

export default function AdminResultsPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [pools, setPools] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Category mode state
  const [pendingResults, setPendingResults] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // NFL mode state
  const [teams, setTeams] = useState([])
  const [rounds, setRounds] = useState([])
  const [eliminations, setEliminations] = useState([])
  const [selectedRound, setSelectedRound] = useState('')
  const [winnerTeam, setWinnerTeam] = useState('')
  const [loserTeam, setLoserTeam] = useState('')

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
      
      // If category-based event, load pending results
      if (!data.uses_reseeding) {
        const initial = {}
        data.categories?.forEach(cat => {
          const correct = cat.options?.find(o => o.is_correct)
          if (correct) {
            initial[cat.id] = correct.id
          }
        })
        setPendingResults(initial)
      }
      
      // If NFL-style event, load teams, rounds, eliminations
      if (data.uses_reseeding) {
        await loadNFLData(eventId)
      }
    }

    // Fetch pools for this event
    const { data: poolsData } = await supabase
      .from('pools')
      .select('id, name')
      .eq('event_id', eventId)
    
    setPools(poolsData || [])

    setLoading(false)
  }

  async function loadNFLData(eventId) {
    // Load teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('conference')
      .order('seed')
    setTeams(teamsData || [])

    // Load rounds
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')
    setRounds(roundsData || [])
    
    // Default to first round
    if (roundsData?.length > 0 && !selectedRound) {
      setSelectedRound(roundsData[0].id)
    }

    // Load existing eliminations
    const { data: elimData } = await supabase
      .from('team_eliminations')
      .select(`
        *,
        team:teams!team_eliminations_team_id_fkey(id, name, seed, conference),
        winner:teams!team_eliminations_defeated_by_team_id_fkey(id, name, seed, conference),
        round:rounds!team_eliminations_eliminated_in_round_id_fkey(id, name, round_order)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    setEliminations(elimData || [])
  }

  // ============ Category Event Functions ============
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

  // ============ NFL Event Functions ============
  const getAliveTeams = () => {
    const eliminatedIds = new Set(eliminations.map(e => e.team_id))
    return teams.filter(t => !eliminatedIds.has(t.id))
  }

  const getTeamsByConference = (conf) => {
    return getAliveTeams().filter(t => t.conference === conf)
  }

  const handleRecordNFLResult = async () => {
    if (!winnerTeam || !loserTeam || !selectedRound) {
      alert('Please select winner, loser, and round')
      return
    }

    if (winnerTeam === loserTeam) {
      alert('Winner and loser cannot be the same team')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('team_eliminations')
        .insert({
          event_id: eventId,
          team_id: loserTeam,
          eliminated_in_round_id: selectedRound,
          defeated_by_team_id: winnerTeam
        })

      if (error) throw error

      setWinnerTeam('')
      setLoserTeam('')
      await loadNFLData(eventId)
      alert('Result recorded!')
    } catch (err) {
      console.error('Error recording result:', err)
      alert('Error recording result: ' + err.message)
    }

    setSaving(false)
  }

  const handleDeleteNFLResult = async (elimId) => {
    if (!confirm('Are you sure you want to delete this result?')) return

    try {
      const { error } = await supabase
        .from('team_eliminations')
        .delete()
        .eq('id', elimId)

      if (error) throw error
      await loadNFLData(eventId)
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting result')
    }
  }

  // ============ Common Functions ============
  async function handleMarkComplete() {
    const confirmed = window.confirm('Mark this event as completed? This will finalize all standings.')
    if (!confirmed) return
    
    setSaving(true)
    
    const res = await fetch(`/api/events/${eventId}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-email': typeof window !== 'undefined' 
          ? localStorage.getItem('pickcrown_email') || 'admin' 
          : 'admin'
      }
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
    } else {
      alert('Event marked as complete!')
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

  // ============ NFL Results UI ============
  if (event.uses_reseeding) {
    const aliveTeams = getAliveTeams()
    const afcTeams = getTeamsByConference('AFC')
    const nfcTeams = getTeamsByConference('NFC')
    const currentRound = rounds.find(r => r.id === selectedRound)

    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader 
          title="🏈 Enter NFL Results" 
          subtitle={event.name}
        />

        {/* Quick Stats */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 24,
          flexWrap: 'wrap'
        }}>
          <Card style={{ flex: 1, minWidth: 120, background: '#f0fdf4', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>{aliveTeams.length}</div>
            <div style={{ fontSize: 12, color: '#166534' }}>Teams Alive</div>
          </Card>
          <Card style={{ flex: 1, minWidth: 120, background: '#fef2f2', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#dc2626' }}>{eliminations.length}</div>
            <div style={{ fontSize: 12, color: '#991b1b' }}>Eliminated</div>
          </Card>
          <Card style={{ flex: 1, minWidth: 120, background: '#eff6ff', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb' }}>{currentRound?.name || '-'}</div>
            <div style={{ fontSize: 12, color: '#1e40af' }}>Current Round</div>
          </Card>
        </div>

        {/* Record Game Result */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>Record Game Result</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {/* Round Select */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                Round
              </label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: 14
                }}
              >
                {rounds.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.points} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Winner Select */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14, color: '#16a34a' }}>
                ✅ Winner
              </label>
              <select
                value={winnerTeam}
                onChange={(e) => setWinnerTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '2px solid #22c55e',
                  fontSize: 14,
                  background: '#f0fdf4'
                }}
              >
                <option value="">Select winner...</option>
                <optgroup label="AFC">
                  {afcTeams.map(t => (
                    <option key={t.id} value={t.id}>#{t.seed} {t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="NFC">
                  {nfcTeams.map(t => (
                    <option key={t.id} value={t.id}>#{t.seed} {t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Loser Select */}
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14, color: '#dc2626' }}>
                ❌ Loser
              </label>
              <select
                value={loserTeam}
                onChange={(e) => setLoserTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '2px solid #ef4444',
                  fontSize: 14,
                  background: '#fef2f2'
                }}
              >
                <option value="">Select loser...</option>
                <optgroup label="AFC">
                  {afcTeams.map(t => (
                    <option key={t.id} value={t.id}>#{t.seed} {t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="NFC">
                  {nfcTeams.map(t => (
                    <option key={t.id} value={t.id}>#{t.seed} {t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRecordNFLResult}
            disabled={saving || !winnerTeam || !loserTeam}
            variant="primary"
            style={{ marginTop: 16 }}
          >
            {saving ? 'Recording...' : '🏈 Record Result'}
          </Button>
        </Card>

        {/* Results History */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>Results History</h3>
          
          {eliminations.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No results recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eliminations.map(elim => (
                <div 
                  key={elim.id}
                  style={{
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>
                      {elim.round?.name}:
                    </span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      #{elim.winner?.seed} {elim.winner?.name}
                    </span>
                    <span style={{ margin: '0 8px', color: '#9ca3af' }}>beat</span>
                    <span style={{ color: '#dc2626' }}>
                      #{elim.team?.seed} {elim.team?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNFLResult(elim.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Team Status */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>Team Status</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* AFC */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>AFC</h4>
              {teams.filter(t => t.conference === 'AFC').map(team => {
                const elim = eliminations.find(e => e.team_id === team.id)
                return (
                  <div 
                    key={team.id}
                    style={{
                      padding: '6px 10px',
                      marginBottom: 4,
                      borderRadius: 4,
                      background: elim ? '#fee2e2' : '#f0fdf4',
                      color: elim ? '#991b1b' : '#166534',
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>#{team.seed} {team.name}</span>
                    {elim && <span style={{ fontSize: 11 }}>Out: {elim.round?.name}</span>}
                  </div>
                )
              })}
            </div>

            {/* NFC */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>NFC</h4>
              {teams.filter(t => t.conference === 'NFC').map(team => {
                const elim = eliminations.find(e => e.team_id === team.id)
                return (
                  <div 
                    key={team.id}
                    style={{
                      padding: '6px 10px',
                      marginBottom: 4,
                      borderRadius: 4,
                      background: elim ? '#fee2e2' : '#f0fdf4',
                      color: elim ? '#991b1b' : '#166534',
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>#{team.seed} {team.name}</span>
                    {elim && <span style={{ fontSize: 11 }}>Out: {elim.round?.name}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Mark Complete */}
        <Card style={{ 
          textAlign: 'center',
          background: event.status === 'completed' ? '#dcfce7' : 'white'
        }}>
          {event.status === 'completed' ? (
            <div style={{ padding: 16, color: '#166534', fontWeight: 'bold' }}>
              ✓ Event Completed
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: 16 }}>
                Once all games are finished, mark the event as complete.
              </p>
              <Button onClick={handleMarkComplete} disabled={saving} variant="primary">
                Mark Event Complete
              </Button>
            </div>
          )}
        </Card>

        {/* Send Results */}
        <SendResultsSection 
          eventId={eventId} 
          eventName={event?.name}
          isCompleted={event?.status === 'completed'}
          pools={pools}
        />
      </div>
    )
  }

  // ============ Category Results UI (Original) ============
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

      {/* Send Results Emails */}
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
