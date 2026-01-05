'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

/**
 * AdvancementPickForm - For events with reseeding (NFL Playoffs)
 * 
 * Instead of picking matchup winners, users pick which teams advance past each round.
 * The UI enforces the Survival Consistency Rule: can't pick a team in Round N 
 * if you eliminated them in Round N-1.
 */
export default function AdvancementPickForm({ pool, rounds, teams, matchups }) {
  const [entryName, setEntryName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({}) // { `${teamId}|${roundId}`: true }
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [existingEntry, setExistingEntry] = useState(null)
  const [loading, setLoading] = useState(false)

  // Helper to create/parse pick keys (using | as separator since UUIDs contain -)
  const makePickKey = (teamId, roundId) => `${teamId}|${roundId}`
  const parsePickKey = (key) => key.split('|')

  // Pre-fill email from localStorage and check for existing entry
  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Check for existing entry when email or pool changes
  useEffect(() => {
    if (email && email.includes('@') && pool?.id) {
      checkExistingEntry(email)
    }
  }, [email, pool?.id])

  // Check for existing entry when email changes
  const checkExistingEntry = async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@') || !pool?.id) return
    
    setLoading(true)
    try {
      // Check if user already has an entry
      const { data: entry, error: entryError } = await supabase
        .from('pool_entries')
        .select('*')
        .eq('pool_id', pool.id)
        .eq('email', emailToCheck.toLowerCase().trim())
        .single()

      console.log('Checking for existing entry:', { email: emailToCheck, poolId: pool.id, entry, error: entryError })

      if (entry) {
        setExistingEntry(entry)
        setEntryName(entry.entry_name)
        if (entry.tie_breaker_value) setTieBreaker(entry.tie_breaker_value.toString())

        // Load existing picks
        const { data: existingPicks, error: picksError } = await supabase
          .from('advancement_picks')
          .select('*')
          .eq('pool_entry_id', entry.id)

        console.log('Loaded existing picks:', { count: existingPicks?.length, picks: existingPicks, error: picksError })

        if (existingPicks && existingPicks.length > 0) {
          const picksMap = {}
          existingPicks.forEach(p => {
            const key = `${p.team_id}|${p.round_id}`
            picksMap[key] = true
            console.log('Pick loaded:', key)
          })
          console.log('Setting picks state:', picksMap)
          setPicks(picksMap)
        } else {
          console.log('No picks found, clearing state')
          setPicks({})
        }
      } else {
        setExistingEntry(null)
        setPicks({})
      }
    } catch (err) {
      console.error('Error loading entry:', err)
      setExistingEntry(null)
    }
    setLoading(false)
  }

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false

  // Sort rounds by order
  const sortedRounds = useMemo(() => 
    [...rounds].sort((a, b) => a.round_order - b.round_order),
    [rounds]
  )

  // Group teams by conference
  const teamsByConference = useMemo(() => {
    const grouped = { AFC: [], NFC: [], other: [] }
    teams.forEach(team => {
      const conf = team.conference?.toUpperCase() || 'other'
      if (grouped[conf]) {
        grouped[conf].push(team)
      } else {
        grouped.other.push(team)
      }
    })
    // Sort by seed
    Object.keys(grouped).forEach(conf => {
      grouped[conf].sort((a, b) => (a.seed || 99) - (b.seed || 99))
    })
    return grouped
  }, [teams])

  // Identify which round is Wild Card (first round, has fixed matchups)
  const wildCardRound = sortedRounds[0]
  
  // Get Wild Card matchups
  const wildCardMatchups = useMemo(() => {
    if (!wildCardRound) return []
    return matchups
      .filter(m => m.round_id === wildCardRound.id && m.team_a_id && m.team_b_id)
      .map(m => ({
        ...m,
        team_a: teams.find(t => t.id === m.team_a_id),
        team_b: teams.find(t => t.id === m.team_b_id)
      }))
  }, [matchups, wildCardRound, teams])

  // Teams with byes (skip Wild Card)
  const byeTeams = useMemo(() => 
    teams.filter(t => t.has_bye),
    [teams]
  )

  // Check if a team is "alive" in user's picks for a given round
  const isTeamAlive = (teamId, roundOrder) => {
    const team = teams.find(t => t.id === teamId)
    
    // Bye teams are alive starting from round 2
    if (team?.has_bye && roundOrder <= 2) return true
    
    // For Wild Card (round 1), all non-bye teams are alive
    if (roundOrder === 1) return !team?.has_bye
    
    // For later rounds, check if user picked this team to advance from previous round
    const prevRound = sortedRounds.find(r => r.round_order === roundOrder - 1)
    if (!prevRound) return false
    
    return picks[`${teamId}|${prevRound.id}`] === true
  }

  // Get teams that can be selected for a round
  const getSelectableTeams = (round, conference) => {
    const confTeams = teamsByConference[conference] || []
    return confTeams.filter(team => isTeamAlive(team.id, round.round_order))
  }

  // Count how many teams are picked for a round/conference
  const getPickCount = (roundId, conference) => {
    const confTeams = teamsByConference[conference] || []
    return confTeams.filter(team => picks[`${team.id}|${roundId}`]).length
  }

  // How many teams should advance from each round per conference
  const getRequiredPicks = (roundOrder) => {
    // NFL structure: WC→4 winners per conf, Div→2 per conf, Conf→1 per conf, SB→1 total
    switch (roundOrder) {
      case 1: return 3  // Wild Card: 3 winners per conference (1 seed has bye)
      case 2: return 2  // Divisional: 2 winners per conference
      case 3: return 1  // Conference Championship: 1 winner per conference
      case 4: return 1  // Super Bowl: 1 total winner (handled separately)
      default: return 0
    }
  }

  // Handle Wild Card matchup pick
  const handleWildCardPick = (matchupId, teamId) => {
    const matchup = wildCardMatchups.find(m => m.id === matchupId)
    if (!matchup) return

    // Remove the other team from this matchup
    const otherTeamId = matchup.team_a_id === teamId ? matchup.team_b_id : matchup.team_a_id

    setPicks(prev => {
      const next = { ...prev }
      // Set winner as advancing from Wild Card
      next[`${teamId}|${wildCardRound.id}`] = true
      // Remove loser from Wild Card
      delete next[`${otherTeamId}|${wildCardRound.id}`]
      
      // Also remove loser from all later rounds (survival rule)
      sortedRounds.forEach(r => {
        if (r.round_order > 1) {
          delete next[`${otherTeamId}|${r.id}`]
        }
      })
      
      return next
    })
  }

  // Handle later round pick (toggle team advancement)
  const handleAdvancementPick = (teamId, roundId, conference) => {
    const round = sortedRounds.find(r => r.id === roundId)
    if (!round) return

    const key = `${teamId}|${roundId}`
    const currentCount = getPickCount(roundId, conference)
    const required = getRequiredPicks(round.round_order)

    setPicks(prev => {
      const next = { ...prev }
      
      if (prev[key]) {
        // Unpicking - remove from this round and all later rounds
        delete next[key]
        sortedRounds.forEach(r => {
          if (r.round_order > round.round_order) {
            delete next[`${teamId}|${r.id}`]
          }
        })
      } else {
        // Picking - check if we're at limit
        if (currentCount >= required) {
          // At limit - don't add
          return prev
        }
        next[key] = true
      }
      
      return next
    })
  }

  // Handle Super Bowl pick (single winner from both conferences)
  const handleSuperBowlPick = (teamId, roundId) => {
    setPicks(prev => {
      const next = { ...prev }
      // Remove any existing Super Bowl pick
      Object.keys(next).forEach(key => {
        if (key.endsWith(`|${roundId}`)) {
          delete next[key]
        }
      })
      // Set new pick
      next[`${teamId}|${roundId}`] = true
      return next
    })
  }

  // Calculate total picks needed and made
  const totalPicksNeeded = useMemo(() => {
    let total = 0
    sortedRounds.forEach(round => {
      if (round.round_order === 4) {
        total += 1 // Super Bowl: 1 pick total
      } else {
        total += getRequiredPicks(round.round_order) * 2 // Per conference × 2
      }
    })
    return total
  }, [sortedRounds])

  const totalPicksMade = Object.keys(picks).length

  const isComplete = 
    entryName.trim() && 
    email.trim() && 
    (!requiresTiebreaker || tieBreaker) &&
    totalPicksMade === totalPicksNeeded

  // Submit picks
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return

    setSubmitting(true)
    setError('')

    try {
      let entryId

      if (existingEntry) {
        // UPDATE existing entry
        entryId = existingEntry.id

        // Update entry details if changed
        const { error: updateError } = await supabase
          .from('pool_entries')
          .update({
            entry_name: entryName.trim(),
            tie_breaker_value: requiresTiebreaker ? parseInt(tieBreaker) : null
          })
          .eq('id', entryId)

        if (updateError) {
          setError('Error updating entry: ' + updateError.message)
          setSubmitting(false)
          return
        }

        // Delete old picks
        const { error: deleteError } = await supabase
          .from('advancement_picks')
          .delete()
          .eq('pool_entry_id', entryId)

        if (deleteError) {
          setError('Error clearing old picks: ' + deleteError.message)
          setSubmitting(false)
          return
        }
      } else {
        // CREATE new entry
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
          setError(entryError.message)
          setSubmitting(false)
          return
        }

        entryId = entry.id
      }

      // Insert advancement picks
      const pickInserts = Object.entries(picks)
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          const [teamId, roundId] = key.split('|')
          return {
            pool_entry_id: entryId,
            team_id: teamId,
            round_id: roundId
          }
        })

      const { error: picksError } = await supabase
        .from('advancement_picks')
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
    return (
      <div style={{
        padding: 32,
        background: '#dcfce7',
        borderRadius: 12,
        border: '1px solid #16a34a',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏈</div>
        <h3 style={{ marginTop: 0 }}>
          {existingEntry ? 'Picks Updated!' : 'Picks Submitted!'}
        </h3>
        <p>Entry name: <strong>{entryName}</strong></p>
        <p style={{ color: '#666' }}>We'll email results to: {email}</p>
        <a
          href={`/pool/${pool.id}/standings`}
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          View Standings
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 8,
          marginBottom: 24,
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* NFL Reseeding Disclaimer */}
      <div style={{
        padding: 16,
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <strong>⚠️ NFL playoffs reseed.</strong>
        <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
          Teams may face different opponents each round. You're picking how far each team 
          advances — not specific matchups.
        </p>
      </div>

      {/* Existing Entry Notice */}
      {existingEntry && (
        <div style={{
          padding: 16,
          background: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: 8,
          marginBottom: 24
        }}>
          <strong>📝 Editing existing entry</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
            You already have picks saved for this pool. Your changes will update your existing entry.
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{
          padding: 16,
          background: '#f3f4f6',
          borderRadius: 8,
          marginBottom: 24,
          textAlign: 'center',
          color: '#666'
        }}>
          Loading your existing picks...
        </div>
      )}

      {/* Entry Info */}
      <div style={{
        padding: 24,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0 }}>Your Entry</h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Entry Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={entryName}
            onChange={(e) => setEntryName(e.target.value)}
            placeholder="e.g., Rich's Playoff Picks"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Email <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={!!existingEntry}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              background: existingEntry ? '#f3f4f6' : 'white'
            }}
          />
          {existingEntry && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
              Email cannot be changed when editing existing picks
            </p>
          )}
        </div>

        {requiresTiebreaker && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              {pool.config?.tiebreaker_label || 'Total Points in Super Bowl'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              value={tieBreaker}
              onChange={(e) => setTieBreaker(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{
        padding: 16,
        background: totalPicksMade === totalPicksNeeded ? '#dcfce7' : '#f3f4f6',
        borderRadius: 8,
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          <strong>{totalPicksMade}</strong> of <strong>{totalPicksNeeded}</strong> picks made
        </span>
        <span style={{
          padding: '4px 12px',
          borderRadius: 16,
          background: totalPicksMade === totalPicksNeeded ? '#16a34a' : '#9ca3af',
          color: 'white',
          fontSize: 12,
          fontWeight: 600
        }}>
          {totalPicksMade === totalPicksNeeded ? '✓ Complete' : 'In Progress'}
        </span>
      </div>

      {/* DEBUG: Show loaded picks (remove this later) */}
      {Object.keys(picks).length > 0 && (
        <div style={{
          padding: 12,
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 12,
          fontFamily: 'monospace'
        }}>
          <strong>DEBUG - Loaded {Object.keys(picks).length} picks:</strong>
          <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(picks, null, 2)}
          </pre>
        </div>
      )}

      {/* Rounds */}
      {sortedRounds.map((round, idx) => (
        <RoundSection
          key={round.id}
          round={round}
          roundIndex={idx}
          isWildCard={idx === 0}
          isSuperBowl={idx === sortedRounds.length - 1 && round.round_order === 4}
          wildCardMatchups={idx === 0 ? wildCardMatchups : []}
          teamsByConference={teamsByConference}
          byeTeams={byeTeams}
          picks={picks}
          getSelectableTeams={getSelectableTeams}
          getPickCount={getPickCount}
          getRequiredPicks={getRequiredPicks}
          isTeamAlive={isTeamAlive}
          onWildCardPick={handleWildCardPick}
          onAdvancementPick={handleAdvancementPick}
          onSuperBowlPick={handleSuperBowlPick}
          teams={teams}
        />
      ))}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isComplete || submitting || loading}
        style={{
          width: '100%',
          padding: 16,
          background: isComplete ? '#16a34a' : '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: isComplete && !loading ? 'pointer' : 'not-allowed',
          marginTop: 24
        }}
      >
        {submitting 
          ? (existingEntry ? 'Updating...' : 'Submitting...') 
          : loading 
            ? 'Loading...'
            : isComplete 
              ? (existingEntry ? '🏈 Update Picks' : '🏈 Submit Picks')
              : `Complete Your Picks (${totalPicksNeeded - totalPicksMade} remaining)`
        }
      </button>

      <p style={{ 
        textAlign: 'center', 
        marginTop: 16, 
        fontSize: 13, 
        color: '#666' 
      }}>
        All picks lock before kickoff. Matchups update automatically as results are entered.
      </p>
    </form>
  )
}

// Round section component
function RoundSection({
  round,
  roundIndex,
  isWildCard,
  isSuperBowl,
  wildCardMatchups,
  teamsByConference,
  byeTeams,
  picks,
  getSelectableTeams,
  getPickCount,
  getRequiredPicks,
  isTeamAlive,
  onWildCardPick,
  onAdvancementPick,
  onSuperBowlPick,
  teams
}) {
  const required = getRequiredPicks(round.round_order)
  
  // Debug: Check if any picks match this round
  const picksForThisRound = Object.keys(picks).filter(key => key.endsWith(`|${round.id}`))
  console.log(`Round ${round.name} (${round.id}): ${picksForThisRound.length} picks found`, picksForThisRound)

  return (
    <div style={{
      padding: 24,
      background: 'white',
      border: isSuperBowl ? '3px solid #fbbf24' : '1px solid #e5e7eb',
      borderRadius: 12,
      marginBottom: 24
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h3 style={{ margin: 0 }}>
          {isSuperBowl ? '🏆 ' : ''}{round.name}
          <span style={{ 
            marginLeft: 8, 
            fontSize: 14, 
            fontWeight: 'normal',
            color: '#666'
          }}>
            ({round.points} pts each)
          </span>
        </h3>
      </div>

      {!isWildCard && !isSuperBowl && (
        <p style={{ 
          fontSize: 13, 
          color: '#666', 
          marginTop: 0,
          marginBottom: 16,
          fontStyle: 'italic'
        }}>
          Opponents determined after previous round (reseeding applies)
        </p>
      )}

      {/* Wild Card: Show actual matchups */}
      {isWildCard && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {['AFC', 'NFC'].map(conference => {
            const confMatchups = wildCardMatchups.filter(m => 
              m.team_a?.conference?.toUpperCase() === conference
            )
            return (
              <div key={conference} style={{ flex: 1, minWidth: 280 }}>
                <h4 style={{ 
                  margin: '0 0 12px 0',
                  color: conference === 'AFC' ? '#dc2626' : '#2563eb'
                }}>
                  {conference}
                </h4>
                {confMatchups.map(matchup => (
                  <WildCardMatchup
                    key={matchup.id}
                    matchup={matchup}
                    pickedTeamId={
                      picks[`${matchup.team_a_id}|${round.id}`] ? matchup.team_a_id :
                      picks[`${matchup.team_b_id}|${round.id}`] ? matchup.team_b_id : null
                    }
                    onPick={(teamId) => onWildCardPick(matchup.id, teamId)}
                  />
                ))}
                {/* Show bye teams */}
                {byeTeams.filter(t => t.conference?.toUpperCase() === conference).map(team => (
                  <div key={team.id} style={{
                    padding: 12,
                    background: '#f3f4f6',
                    borderRadius: 8,
                    marginBottom: 8,
                    textAlign: 'center',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    #{team.seed} {team.name} — BYE
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Later Rounds (not Wild Card, not Super Bowl): Pick teams to advance */}
      {!isWildCard && !isSuperBowl && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {['AFC', 'NFC'].map(conference => {
            const selectableTeams = getSelectableTeams(round, conference)
            const pickCount = getPickCount(round.id, conference)
            
            return (
              <div key={conference} style={{ flex: 1, minWidth: 280 }}>
                <h4 style={{ 
                  margin: '0 0 8px 0',
                  color: conference === 'AFC' ? '#dc2626' : '#2563eb'
                }}>
                  {conference}
                  <span style={{ 
                    fontWeight: 'normal', 
                    fontSize: 13,
                    marginLeft: 8 
                  }}>
                    ({pickCount}/{required} selected)
                  </span>
                </h4>
                <p style={{ fontSize: 12, color: '#666', marginTop: 0, marginBottom: 12 }}>
                  Pick {required} team{required > 1 ? 's' : ''} to advance
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectableTeams.map(team => {
                    const isSelected = picks[`${team.id}|${round.id}`]
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => onAdvancementPick(team.id, round.id, conference)}
                        disabled={!isSelected && pickCount >= required}
                        style={{
                          padding: '10px 16px',
                          background: isSelected ? '#16a34a' : 'white',
                          color: isSelected ? 'white' : '#374151',
                          border: isSelected ? '2px solid #16a34a' : '1px solid #d1d5db',
                          borderRadius: 8,
                          cursor: (!isSelected && pickCount >= required) ? 'not-allowed' : 'pointer',
                          opacity: (!isSelected && pickCount >= required) ? 0.5 : 1,
                          textAlign: 'left',
                          fontWeight: isSelected ? 600 : 400,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>#{team.seed} {team.name}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    )
                  })}
                  {selectableTeams.length === 0 && (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 13 }}>
                      No teams available (make picks in previous rounds first)
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Super Bowl: Pick single winner */}
      {isSuperBowl && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
            Pick the Super Bowl champion
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['AFC', 'NFC'].map(conference => {
              const selectableTeams = getSelectableTeams(round, conference)
              return selectableTeams.map(team => {
                const isSelected = picks[`${team.id}|${round.id}`]
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => onSuperBowlPick(team.id, round.id)}
                    style={{
                      padding: '16px 24px',
                      background: isSelected ? '#fbbf24' : 'white',
                      color: isSelected ? '#78350f' : '#374151',
                      border: isSelected ? '3px solid #f59e0b' : '1px solid #d1d5db',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 16,
                      minWidth: 180
                    }}
                  >
                    <span style={{ 
                      display: 'block',
                      fontSize: 11,
                      color: team.conference?.toUpperCase() === 'AFC' ? '#dc2626' : '#2563eb',
                      marginBottom: 4
                    }}>
                      {team.conference?.toUpperCase()}
                    </span>
                    #{team.seed} {team.name}
                    {isSelected && <span style={{ marginLeft: 8 }}>🏆</span>}
                  </button>
                )
              })
            })}
            {getSelectableTeams(round, 'AFC').length === 0 && 
             getSelectableTeams(round, 'NFC').length === 0 && (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                Complete earlier rounds to unlock Super Bowl pick
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Wild Card matchup component
function WildCardMatchup({ matchup, pickedTeamId, onPick }) {
  const teamA = matchup.team_a
  const teamB = matchup.team_b

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12
    }}>
      <TeamButton
        team={teamA}
        isSelected={pickedTeamId === teamA?.id}
        onClick={() => onPick(teamA.id)}
      />
      <div style={{ 
        textAlign: 'center', 
        padding: 4, 
        background: '#f3f4f6',
        fontSize: 11,
        color: '#9ca3af'
      }}>
        vs
      </div>
      <TeamButton
        team={teamB}
        isSelected={pickedTeamId === teamB?.id}
        onClick={() => onPick(teamB.id)}
      />
    </div>
  )
}

function TeamButton({ team, isSelected, onClick, disabled }) {
  if (!team) return null
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: isSelected ? '#16a34a' : 'white',
        color: isSelected ? 'white' : '#374151',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: isSelected ? 600 : 400,
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <span>#{team.seed} {team.name}</span>
      {isSelected && <span>✓</span>}
    </button>
  )
}
