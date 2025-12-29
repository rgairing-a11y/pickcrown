'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Alert, FormField } from './ui'
import { sortByOrderIndex, getErrorMessage } from '../lib/utils'
import { getPhaseStatus, isPhaseUnlocked } from '../lib/phases'
import Link from 'next/link'

export default function PickSubmissionForm({ pool }) {
  const [entryName, setEntryName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false
  const phases = (pool.event.phases || []).sort((a, b) => a.phase_order - b.phase_order)
  const hasPhases = phases.length > 0

  // Get categories for a specific phase
  const getCategoriesForPhase = (phaseId) => {
    return sortByOrderIndex(
      (pool.event.categories || []).filter(c => c.phase_id === phaseId)
    )
  }

  // Categories without a phase (backward compatibility)
  const standaloneCats = sortByOrderIndex(
    (pool.event.categories || []).filter(c => !c.phase_id)
  )

  // Get all categories user can submit to right now
  const getSubmittableCategories = () => {
    if (!hasPhases) return standaloneCats

    const openPhases = phases.filter(p => 
      getPhaseStatus(p) === 'open' && isPhaseUnlocked(p, phases)
    )
    
    return [
      ...standaloneCats,
      ...openPhases.flatMap(p => getCategoriesForPhase(p.id))
    ]
  }

  const submittableCats = getSubmittableCategories()

  const handlePick = (categoryId, optionId) => {
    setPicks(prev => ({
      ...prev,
      [categoryId]: optionId
    }))
  }

  const isComplete =
    entryName.trim() &&
    email.trim() &&
    (!requiresTiebreaker || tieBreaker) &&
    submittableCats.length > 0 &&
    submittableCats.every(cat => picks[cat.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return

    setSubmitting(true)
    setError('')

    try {
      const { data: entry, error: entryError } = await supabase
        .from('pool_entries')
        .insert({
          pool_id: pool.id,
          entry_name: entryName.trim(),
          email: email.toLowerCase().trim(),
          tie_breaker_value: requiresTiebreaker ? parseInt(tieBreaker) : null
        })
        .select()
        .single()

      if (entryError) {
        setError(getErrorMessage(entryError))
        setSubmitting(false)
        return
      }

      const pickInserts = Object.entries(picks).map(([categoryId, optionId]) => ({
        pool_entry_id: entry.id,
        category_id: categoryId,
        option_id: optionId
      }))

      const { error: picksError } = await supabase
        .from('category_picks')
        .insert(pickInserts)

      if (picksError) {
        setError('Error saving picks: ' + picksError.message)
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError('Unexpected error: ' + err.message)
      setSubmitting(false)
    }
  }

  // Render a phase section
  const renderPhaseSection = (phase) => {
    const status = getPhaseStatus(phase)
    const unlocked = isPhaseUnlocked(phase, phases)
    const categories = getCategoriesForPhase(phase.id)

    // Phase not yet unlocked (waiting for previous phase results)
    if (!unlocked) {
      return (
        <div key={phase.id} style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          background: 'var(--color-background-alt)',
          borderRadius: 'var(--radius-md)',
          opacity: 0.7
        }}>
          <h4 style={{ margin: 0, color: 'var(--color-text-light)' }}>
            🔒 {phase.name}
          </h4>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 0, marginTop: 'var(--spacing-sm)' }}>
            Waiting for previous phase results...
          </p>
        </div>
      )
    }

    // Phase locked or completed
    if (status === 'locked' || status === 'completed') {
      return (
        <div key={phase.id} style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          background: 'var(--color-background-alt)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h4 style={{ margin: 0 }}>
            {status === 'completed' ? '✓' : '🔒'} {phase.name}
          </h4>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 0, marginTop: 'var(--spacing-sm)' }}>
            {status === 'completed' ? 'Results entered' : 'Picks locked'}
          </p>
        </div>
      )
    }

    // Phase open - show picks
    return (
      <div key={phase.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h4 style={{
          borderBottom: '2px solid var(--color-primary)',
          paddingBottom: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          {phase.name}
        </h4>
        {categories.map(category => (
          <FormField key={category.id} label={category.name} required>
            <select
              value={picks[category.id] || ''}
              onChange={(e) => handlePick(category.id, e.target.value)}
              required
            >
              <option value="">-- Select --</option>
              {category.options?.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </FormField>
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{
        padding: 'var(--spacing-xl)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-success)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-md)' }}>
          {'✅'}
        </div>
        <h3 style={{ marginTop: 0 }}>Picks Submitted!</h3>
        <p>Entry name: <strong>{entryName}</strong></p>
        <p style={{ color: 'var(--color-text-light)' }}>
          We will email results to: {email}
        </p>
        <Link
          href={'/pool/' + pool.id + '/standings'}
          style={{
            display: 'inline-block',
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold'
          }}
        >
          View Standings
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
          {error}
        </Alert>
      )}

      <FormField label="Entry Name" required hint="Cannot be changed after submission">
        <input
          type="text"
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="e.g., Rich's Picks"
          required
        />
      </FormField>

      <FormField label="Email" required>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </FormField>

      {requiresTiebreaker && (
        <FormField label={pool.config.tiebreaker_label || 'Tie-breaker'} required>
          <input
            type="number"
            value={tieBreaker}
            onChange={(e) => setTieBreaker(e.target.value)}
            required
          />
        </FormField>
      )}

      <hr style={{
        margin: 'var(--spacing-xl) 0',
        border: 'none',
        borderTop: '1px solid var(--color-border)'
      }} />

      <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Make Your Picks</h3>

      {/* Render phases if multi-phase event */}
      {hasPhases && phases.map(phase => renderPhaseSection(phase))}

      {/* Render standalone categories (no phase) */}
      {standaloneCats.map(category => (
        <FormField key={category.id} label={category.name} required>
          <select
            value={picks[category.id] || ''}
            onChange={(e) => handlePick(category.id, e.target.value)}
            required
          >
            <option value="">-- Select --</option>
            {category.options?.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </FormField>
      ))}

      {/* No picks available message */}
      {submittableCats.length === 0 && hasPhases && (
        <Alert variant="warning" style={{ textAlign: 'center' }}>
          No picks available right now. Check back when the next phase opens!
        </Alert>
      )}

      {/* Submit button */}
      {submittableCats.length > 0 && (
        <Button
          type="submit"
          variant={isComplete ? 'success' : 'secondary'}
          loading={submitting}
          disabled={!isComplete}
          style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
        >
          Submit All Picks
        </Button>
      )}
    </form>
  )
}