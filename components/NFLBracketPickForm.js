'use client'

// NFLBracketPickForm.js
// Pick form for NFL Playoffs as a TRUE BRACKET event with reseeding
//
// CONCERN A - PICK-TIME BRACKET PROJECTION (CLIENT / UI)
//
// This component:
// 1. Shows Wildcard matchups with real teams (fixed)
// 2. Projects Divisional matchups based on user's Wildcard picks (memory only)
// 3. Projects Conference/Super Bowl matchups based on earlier picks
// 4. All projections use NFL reseeding rules (highest vs lowest seed)
// 5. Picks are stored in bracket_picks table against matchup_id
//
// Wrong picks are allowed - no validation blocks a user from picking
// a team that "wouldn't exist" based on prior picks. This is intentional.

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Alert, FormField, Card } from './ui'
import { createMap, getConferences, getErrorMessage } from '../lib/utils'
import { generateReseedMatchups, getAdvancingTeamsFromPicks } from '../lib/nflReseeding'

export default function NFLBracketPickForm({ pool, rounds, matchups, teams }) {
  const [entryName, setEntryName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({}) // matchup_id -> team_id
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false
  const teamMap = createMap(teams)
  const conferences = getConferences(teams)

  // Organize rounds by order
  const sortedRounds = useMemo(() => {
    return [...rounds].sort((a, b) => a.round_order - b.round_order)
  }, [rounds])

  // Get round by order
  const getRoundByOrder = (order) => sortedRounds.find(r => r.round_order === order)

  // Get matchups for a round
  const getMatchupsForRound = (roundId) => {
    return matchups
      .filter(m => m.round_id === roundId)
      .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))
  }

  // Build matchup structure with team data and projections
  const matchupsWithProjectedTeams = useMemo(() => {
    const result = {}

    sortedRounds.forEach(round => {
      const roundMatchups = getMatchupsForRound(round.id)

      if (round.round_order === 1) {
        // Wildcard: use actual teams from matchups
        result[round.id] = roundMatchups.map(m => ({
          ...m,
          team_a: teamMap[m.team_a_id],
          team_b: teamMap[m.team_b_id],
          isProjected: false
        }))
      } else {
        // Later rounds: project teams based on picks from previous round
        const prevRound = getRoundByOrder(round.round_order - 1)
        if (!prevRound) {
          result[round.id] = roundMatchups.map(m => ({
            ...m,
            team_a: teamMap[m.team_a_id],
            team_b: teamMap[m.team_b_id],
            isProjected: false
          }))
          return
        }

        const prevMatchups = result[prevRound.id] || []

        // Get advancing teams from previous round based on picks
        // For round 2 (Divisional), also add bye teams
        let advancingTeams = getAdvancingTeamsFromPicks(prevMatchups, picks, teamMap)

        // For Divisional round, add bye teams
        if (round.round_order === 2) {
          teams.forEach(team => {
            if (team.has_bye && !advancingTeams.find(t => t.id === team.id)) {
              advancingTeams.push(team)
            }
          })
        }

        // Apply reseeding - project matchups
        const afcMatchups = generateReseedMatchups(advancingTeams, 'AFC')
        const nfcMatchups = generateReseedMatchups(advancingTeams, 'NFC')
        const projectedPairs = [...afcMatchups, ...nfcMatchups]

        // Map projected teams to matchup slots by bracket_position
        result[round.id] = roundMatchups.map(m => {
          // Find projected pair for this bracket position
          const projected = projectedPairs.find(p => p.bracket_position === m.bracket_position)

          // Determine conference based on bracket_position
          // Positions 1-2 are AFC, 3-4 are NFC (for Divisional)
          // Positions 1 is AFC, 2 is NFC (for Conference Championship)
          let conference = 'AFC'
          if (round.round_order === 2) {
            conference = m.bracket_position <= 2 ? 'AFC' : 'NFC'
          } else if (round.round_order === 3) {
            conference = m.bracket_position === 1 ? 'AFC' : 'NFC'
          }

          // Find the projected matchup for this conference and position
          const confMatchups = conference === 'AFC' ? afcMatchups : nfcMatchups
          const posInConf = conference === 'AFC'
            ? m.bracket_position
            : (round.round_order === 2 ? m.bracket_position - 2 : m.bracket_position - 1)
          const projMatch = confMatchups.find(p => p.bracket_position === posInConf)

          if (projMatch) {
            return {
              ...m,
              team_a: projMatch.team_a,
              team_b: projMatch.team_b,
              team_a_id: projMatch.team_a?.id,
              team_b_id: projMatch.team_b?.id,
              isProjected: true
            }
          }

          // Fallback: use existing team IDs if set
          return {
            ...m,
            team_a: teamMap[m.team_a_id],
            team_b: teamMap[m.team_b_id],
            isProjected: !m.team_a_id || !m.team_b_id
          }
        })
      }
    })

    return result
  }, [sortedRounds, matchups, picks, teamMap, teams])

  // Organize rounds with their projected matchups
  const roundsWithMatchups = useMemo(() => {
    return sortedRounds.map(round => ({
      ...round,
      matchups: matchupsWithProjectedTeams[round.id] || []
    }))
  }, [sortedRounds, matchupsWithProjectedTeams])

  // Calculate total matchups that need picks
  const totalMatchups = matchups.filter(m => {
    // Count matchups that have two teams OR are projected to have two teams
    const projected = Object.values(matchupsWithProjectedTeams)
      .flat()
      .find(pm => pm.id === m.id)
    if (projected) {
      return projected.team_a_id && projected.team_b_id
    }
    return m.team_a_id && m.team_b_id
  }).length

  const pickedCount = Object.keys(picks).length

  const isComplete =
    entryName.trim() &&
    email.trim() &&
    (!requiresTiebreaker || tieBreaker) &&
    pickedCount === totalMatchups

  const handlePick = (matchupId, teamId) => {
    setPicks(prev => ({
      ...prev,
      [matchupId]: teamId
    }))
  }

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
          display_name: displayName.trim() || null,
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
        picked_team_id: teamId
      }))

      const { error: picksError } = await supabase
        .from('bracket_picks')
        .insert(pickInserts)

      if (picksError) {
        setError('Error saving picks: ' + picksError.message)
        setSubmitting(false)
        return
      }

      localStorage.setItem('pickcrown_email', email.toLowerCase().trim())
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
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-md)' }}>🏈</div>
        <h3 style={{ marginTop: 0 }}>NFL Bracket Submitted!</h3>
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

      {/* NFL Reseeding Notice */}
      <Alert variant="info" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <strong>NFL Playoffs use reseeding.</strong> After Wild Card, the highest remaining seed plays the lowest remaining seed.
        Matchups shown beyond Wild Card are <em>projected</em> based on your picks.
      </Alert>

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

        <FormField label="Email" required hint="For reminders and results">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </FormField>

        <FormField label="What should we call you?" hint="This appears on standings">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={email ? email.split('@')[0] : 'Your name'}
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
            {pickedCount === totalMatchups ? 'Complete' : 'In Progress'}
          </span>
        </div>

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
          Click on a team to pick them as the winner. Matchups marked <em>"Projected"</em> are based on your earlier picks.
        </p>

        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xxl)',
          minWidth: 'fit-content',
          paddingBottom: 'var(--spacing-lg)'
        }}>
          {roundsWithMatchups.map((round, roundIndex) => {
            const isChampionship = round.round_order === rounds.length
            const isSuperBowl = round.name?.toLowerCase().includes('super bowl')
            const gap = Math.pow(2, roundIndex) * 20
            const padding = Math.pow(2, roundIndex) * 10

            return (
              <div
                key={round.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 220
                }}
              >
                {/* Round Header */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: 'var(--spacing-lg)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: isChampionship || isSuperBowl
                    ? 'var(--color-gold-light)'
                    : 'var(--color-background)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: 'var(--font-size-sm)',
                  color: isChampionship || isSuperBowl
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
                    <NFLPickableMatchup
                      key={matchup.id}
                      matchup={matchup}
                      pickedTeamId={picks[matchup.id]}
                      onPick={(teamId) => handlePick(matchup.id, teamId)}
                      isChampionship={isChampionship || isSuperBowl}
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
        {isComplete ? 'Submit NFL Bracket' : `Complete Your Picks (${totalMatchups - pickedCount} remaining)`}
      </Button>
    </form>
  )
}

function NFLPickableMatchup({ matchup, pickedTeamId, onPick, isChampionship }) {
  const teamA = matchup.team_a
  const teamB = matchup.team_b
  const isByeGame = (teamA && !teamB) || (!teamA && teamB)
  const isProjected = matchup.isProjected
  const hasBothTeams = teamA && teamB

  // If no teams yet (user hasn't picked enough), show placeholder
  if (!teamA && !teamB) {
    return (
      <div style={{
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        minWidth: 200,
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        background: 'var(--color-background-dark)'
      }}>
        <div style={{ fontSize: 12, marginBottom: 4 }}>Matchup TBD</div>
        <div style={{ fontSize: 11 }}>Complete earlier picks</div>
      </div>
    )
  }

  // Bye game (shouldn't happen in NFL but handle it)
  if (isByeGame) {
    const byeTeam = teamA || teamB
    return (
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minWidth: 200,
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
          #{byeTeam.seed} {byeTeam.name}
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
      minWidth: 200,
      boxShadow: isChampionship
        ? '0 4px 12px rgba(212, 175, 55, 0.3)'
        : 'var(--shadow-sm)',
      position: 'relative'
    }}>
      {/* Projected indicator */}
      {isProjected && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          fontSize: 9,
          padding: '2px 6px',
          background: 'var(--color-info-light)',
          color: 'var(--color-info)',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Projected
        </div>
      )}

      <NFLPickableTeamRow
        team={teamB}
        isSelected={pickedTeamId === teamB?.id}
        onSelect={() => teamB && onPick(teamB.id)}
      />
      <NFLPickableTeamRow
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
          YOUR CHAMPION
        </div>
      )}
    </div>
  )
}

function NFLPickableTeamRow({ team, isSelected, onSelect, isBottom = false }) {
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

  // Conference color
  const confColor = team.conference === 'AFC' ? '#c41e3a' : '#003594'

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
        borderLeft: `4px solid ${confColor}`,
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
        <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
          Picked
        </span>
      )}
    </button>
  )
}
