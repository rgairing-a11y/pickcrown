'use client'

import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Alert, FormField, Card } from './ui'
import { createMap, getConferences, getErrorMessage } from '../lib/utils'
import { CONFERENCE_COLORS } from '../lib/constants'

export default function BracketPickForm({ pool, rounds, matchups, teams }) {
  const [entryName, setEntryName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({}) // matchup_id -> team_id
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false
  const teamMap = createMap(teams)
  const conferences = getConferences(teams)

  // Build matchup structure with team data
  const matchupsWithTeams = useMemo(() => {
    return matchups.map(m => ({
      ...m,
      team_a: teamMap[m.team_a_id],
      team_b: teamMap[m.team_b_id]
    }))
  }, [matchups, teamMap])

  // Organize matchups by round
  const roundsWithMatchups = useMemo(() => {
    return rounds.map(round => ({
      ...round,
      matchups: matchupsWithTeams
        .filter(m => m.round_id === round.id)
        .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))
    }))
  }, [rounds, matchupsWithTeams])

  // Calculate total matchups that need picks
  const totalMatchups = matchups.filter(m => m.team_a_id && m.team_b_id).length
  const pickedCount = Object.keys(picks).length

  // Check if bracket is complete
  const isComplete = 
    entryName.trim() && 
    email.trim() && 
    (!requiresTiebreaker || tieBreaker) &&
    pickedCount === totalMatchups

  // Handle picking a team
  const handlePick = (matchupId, teamId) => {
    setPicks(prev => ({
      ...prev,
      [matchupId]: teamId
    }))
  }

  // Get the picked team for a matchup
  const getPickedTeam = (matchupId) => {
    return picks[matchupId] ? teamMap[picks[matchupId]] : null
  }

  // Submit the bracket
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return

    setSubmitting(true)
    setError('')

    try {
      // 1. Create pool entry
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

      // 2. Insert all bracket picks
      const pickInserts = Object.entries(picks).map(([matchupId, teamId]) => ({
        pool_entry_id: entry.id,
        matchup_id: matchupId,
        team_id: teamId
      }))

      const { error: picksError } = await supabase
        .from('bracket_picks')
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

  if (submitted) {
    const standingsUrl = '/pool/' + pool.id + '/standings'
    return (
      <div style={{
        padding: 'var(--spacing-xl)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-success)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-md)' }}>🏆</div>
        <h3 style={{ marginTop: 0 }}>Bracket Submitted!</h3>
        <p>Entry name: <strong>{entryName}</strong></p>
        <p style={{ color: 'var(--color-text-light)' }}>
          We will email results to: {email}
        </p>
        <Button href={standingsUrl} variant="primary">
          View Standings
        </Button>
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

      {/* Entry Info */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ marginTop: 0 }}>Your Entry</h3>
        
        <FormField label="Entry Name" required hint="Cannot be changed after submission">
          <input
            type="text"
            value={entryName}
            onChange={(e) => setEntryName(e.target.value)}
            placeholder="e.g., Rich's Championship Picks"
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
      </Card>

      {/* Progress */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span>
            <strong>{pickedCount}</strong> of <strong>{totalMatchups}</strong> picks made
          </span>
          <span style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            background: pickedCount === totalMatchups 
              ? 'var(--color-success-light)' 
              : 'var(--color-warning-light)',
            color: pickedCount === totalMatchups 
              ? 'var(--color-success-dark)' 
              : 'var(--color-warning)',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-sm)'
          }}>
            {pickedCount === totalMatchups ? '✓ Complete' : 'In Progress'}
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          marginTop: 'var(--spacing-md)',
          height: 8,
          background: 'var(--color-background-dark)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(pickedCount / totalMatchups) * 100}%`,
            background: pickedCount === totalMatchups 
              ? 'var(--color-success)' 
              : 'var(--color-primary)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </Card>

      {/* Bracket */}
      <Card style={{ overflowX: 'auto', marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ marginTop: 0 }}>Make Your Picks</h3>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>
          Click on a team to pick them as the winner
        </p>

        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xxl)',
          minWidth: 'fit-content',
          paddingBottom: 'var(--spacing-lg)'
        }}>
          {roundsWithMatchups.map((round, roundIndex) => {
            const isChampionship = round.round_order === rounds.length
            const gap = Math.pow(2, roundIndex) * 20
            const padding = Math.pow(2, roundIndex) * 10

            return (
              <div
                key={round.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 200
                }}
              >
                {/* Round Header */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: 'var(--spacing-lg)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: isChampionship 
                    ? 'var(--color-gold-light)' 
                    : 'var(--color-background)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: 'var(--font-size-sm)',
                  color: isChampionship 
                    ? 'var(--color-gold)' 
                    : 'var(--color-text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {round.name}
                  <span style={{
                    marginLeft: 'var(--spacing-sm)',
                    fontWeight: 'normal',
                    opacity: 0.7
                  }}>
                    ({round.points} pts)
                  </span>
                </div>

                {/* Matchups */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: gap,
                  paddingTop: padding,
                  paddingBottom: padding,
                  flex: 1,
                  justifyContent: 'space-around'
                }}>
                  {round.matchups.map((matchup) => (
                    <PickableMatchup
                      key={matchup.id}
                      matchup={matchup}
                      pickedTeamId={picks[matchup.id]}
                      onPick={(teamId) => handlePick(matchup.id, teamId)}
                      isChampionship={isChampionship}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        variant={isComplete ? 'success' : 'secondary'}
        loading={submitting}
        disabled={!isComplete}
        style={{ width: '100%' }}
        size="lg"
      >
        {isComplete ? '🏆 Submit Bracket' : `Complete Your Picks (${totalMatchups - pickedCount} remaining)`}
      </Button>
    </form>
  )
}

function PickableMatchup({ matchup, pickedTeamId, onPick, isChampionship }) {
  const teamA = matchup.team_a
  const teamB = matchup.team_b
  const isByeGame = !teamB

  // If it's a bye, auto-select team A
  if (isByeGame && teamA) {
    return (
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minWidth: 180,
        opacity: 0.7
      }}>
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-background-dark)',
          textAlign: 'center',
          fontStyle: 'italic',
          color: 'var(--color-text-muted)'
        }}>
          BYE
        </div>
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-success-light)',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          #{teamA.seed} {teamA.name} ✓
        </div>
      </div>
    )
  }

  return (
    <div style={{
      border: isChampionship 
        ? '3px solid var(--color-gold)' 
        : '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      minWidth: 180,
      boxShadow: isChampionship
        ? '0 4px 12px rgba(212, 175, 55, 0.3)'
        : 'var(--shadow-sm)'
    }}>
      <PickableTeamRow
        team={teamB}
        isSelected={pickedTeamId === teamB?.id}
        onSelect={() => teamB && onPick(teamB.id)}
      />
      <PickableTeamRow
        team={teamA}
        isSelected={pickedTeamId === teamA?.id}
        onSelect={() => teamA && onPick(teamA.id)}
        isBottom
      />
      
      {isChampionship && pickedTeamId && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'linear-gradient(135deg, var(--color-gold), #f4d03f)',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 'var(--font-size-sm)'
        }}>
          🏆 YOUR CHAMPION
        </div>
      )}
    </div>
  )
}

function PickableTeamRow({ team, isSelected, onSelect, isBottom = false }) {
  if (!team) {
    return (
      <div style={{
        padding: 'var(--spacing-md)',
        background: 'var(--color-background-dark)',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        borderBottom: isBottom ? 'none' : '1px solid var(--color-border-light)',
        minHeight: 42
      }}>
        TBD
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        padding: 'var(--spacing-md)',
        background: isSelected 
          ? 'var(--color-success-light)' 
          : 'var(--color-white)',
        border: 'none',
        borderBottom: isBottom ? 'none' : '1px solid var(--color-border-light)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 42,
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--color-primary-light)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--color-white)'
        }
      }}
    >
      <span style={{
        fontWeight: isSelected ? 'bold' : 'normal',
        color: isSelected ? 'var(--color-success-dark)' : 'var(--color-text)'
      }}>
        #{team.seed} {team.name}
      </span>
      {isSelected && (
        <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
      )}
    </button>
  )
}