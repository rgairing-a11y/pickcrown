// components/MyPicksButton.js
// Fixed version that handles pool structure and both bracket_picks table AND picks JSON column

'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/clients'

const supabase = getBrowserClient()

export default function MyPicksButton({ pool, userEmail }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entry, setEntry] = useState(null)
  const [picks, setPicks] = useState([])
  const [matchups, setMatchups] = useState([])
  const [rounds, setRounds] = useState([])
  const [teams, setTeams] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryPicks, setCategoryPicks] = useState([])
  const [eliminations, setEliminations] = useState({})
  const [emailInput, setEmailInput] = useState(userEmail || '')
  const [searchedEmail, setSearchedEmail] = useState('')
  const [jsonPicks, setJsonPicks] = useState(null) // For picks stored in JSON column

  // Safely get pool and event IDs
  const poolId = pool?.id
  const eventId = pool?.event?.id || pool?.event_id
  const usesReseeding = pool?.event?.uses_reseeding === true

  const loadPicks = async (email) => {
    if (!email || !poolId) {
      console.error('Missing email or poolId', { email, poolId })
      return
    }
    setLoading(true)
    setSearchedEmail(email)

    try {
      // Get user's entry (including picks JSON column if it exists)
      const { data: entryData, error: entryError } = await supabase
        .from('pool_entries')
        .select('*')
        .eq('pool_id', poolId)
        .eq('email', email.toLowerCase().trim())
        .single()

      if (entryError || !entryData) {
        console.log('No entry found:', entryError)
        setEntry(null)
        setPicks([])
        setJsonPicks(null)
        setLoading(false)
        return
      }
      setEntry(entryData)
      
      // Check if picks are stored in JSON column
      if (entryData.picks && typeof entryData.picks === 'object') {
        console.log('Found JSON picks:', entryData.picks)
        setJsonPicks(entryData.picks)
      }

      if (!eventId) {
        console.error('Missing eventId')
        setLoading(false)
        return
      }

      // Get rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .eq('event_id', eventId)
        .order('round_order')
      setRounds(roundsData || [])

      // Get teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', eventId)
        .order('seed')
      setTeams(teamsData || [])

      if (usesReseeding) {
        // NFL-style: Load advancement picks
        const { data: advPicks } = await supabase
          .from('advancement_picks')
          .select('*')
          .eq('pool_entry_id', entryData.id)
        setPicks(advPicks || [])

        // Get eliminations for correct/incorrect display
        const { data: elimData } = await supabase
          .from('team_eliminations')
          .select('*')
          .eq('event_id', eventId)
        
        const elimMap = {}
        elimData?.forEach(e => {
          elimMap[e.team_id] = e.eliminated_in_round_id
        })
        setEliminations(elimMap)

      } else {
        // Standard bracket - try bracket_picks table first
        const { data: matchupsData } = await supabase
          .from('matchups')
          .select('*, round:rounds(name, round_order, points)')
          .eq('event_id', eventId)
          .order('bracket_position')
        setMatchups(matchupsData || [])

        const { data: bracketPicks } = await supabase
          .from('bracket_picks')
          .select('*')
          .eq('pool_entry_id', entryData.id)
        
        // If bracket_picks table has data, use it
        if (bracketPicks && bracketPicks.length > 0) {
          setPicks(bracketPicks)
        } else {
          // Otherwise picks might be in JSON column (handled above)
          setPicks([])
        }

        // Also load category picks if any
        const { data: catsData } = await supabase
          .from('categories')
          .select('*, options:category_options(*)')
          .eq('event_id', eventId)
          .order('order_index')
        setCategories(catsData || [])

        if (catsData?.length > 0) {
          const { data: catPicks } = await supabase
            .from('category_picks')
            .select('*')
            .eq('pool_entry_id', entryData.id)
          setCategoryPicks(catPicks || [])
        }
      }

    } catch (err) {
      console.error('Error loading picks:', err)
    }

    setLoading(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (emailInput) {
      loadPicks(emailInput)
    }
  }

  const handleFind = () => {
    if (emailInput) {
      loadPicks(emailInput)
    }
  }

  // Check if pick is correct for NFL advancement
  const isPickCorrect = (teamId, roundId) => {
    const round = rounds.find(r => r.id === roundId)
    if (!round) return null

    const elimRoundId = eliminations[teamId]
    
    // If no elimination record, team is still alive
    if (!elimRoundId) {
      // Only count as correct if results have started coming in
      if (Object.keys(eliminations).length === 0) return null
      return true
    }
    
    const elimRound = rounds.find(r => r.id === elimRoundId)
    if (!elimRound) return null

    // Team advanced past this round if eliminated in a LATER round
    return elimRound.round_order > round.round_order
  }

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const roundMap = Object.fromEntries(rounds.map(r => [r.id, r]))

  // Calculate total correct picks for NFL
  const nflStats = usesReseeding ? {
    total: picks.length,
    correct: picks.filter(p => isPickCorrect(p.team_id, p.round_id) === true).length,
    incorrect: picks.filter(p => isPickCorrect(p.team_id, p.round_id) === false).length,
    pending: picks.filter(p => isPickCorrect(p.team_id, p.round_id) === null).length,
  } : null

  // Check if we have any picks data
  const hasPicksData = picks.length > 0 || (jsonPicks && Object.keys(jsonPicks).length > 0)

  if (!poolId) {
    return (
      <button
        disabled
        style={{
          padding: '10px 20px',
          background: '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'not-allowed',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        🎯 My Picks (Error: No pool)
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: usesReseeding ? '#dc2626' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        {usesReseeding ? '🏈' : '🎯'} My Picks
      </button>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 16
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 700,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                {usesReseeding ? '🏈' : '🎯'} My Picks
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Email Search */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
                <button
                  onClick={handleFind}
                  disabled={!emailInput || loading}
                  style={{
                    padding: '10px 24px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: emailInput ? 'pointer' : 'not-allowed',
                    opacity: emailInput ? 1 : 0.5
                  }}
                >
                  Find
                </button>
              </div>

              {/* Entry found indicator */}
              {entry && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: '#dcfce7',
                  borderRadius: 6,
                  fontSize: 14
                }}>
                  <strong>{entry.entry_name}</strong>
                  <span style={{ color: '#666', marginLeft: 8 }}>{entry.email}</span>
                  {usesReseeding && nflStats && (
                    <span style={{ 
                      marginLeft: 12,
                      padding: '2px 8px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: 12,
                      fontSize: 12
                    }}>
                      {nflStats.total} picks
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Loading...
                </div>
              ) : !searchedEmail ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Enter your email to view your picks
                </div>
              ) : !entry ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No entry found for {searchedEmail}
                </div>
              ) : !hasPicksData ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No picks submitted yet
                </div>
              ) : usesReseeding ? (
                // NFL Advancement Picks Display
                <NFLPicksDisplay
                  picks={picks}
                  rounds={rounds}
                  teams={teams}
                  teamMap={teamMap}
                  roundMap={roundMap}
                  eliminations={eliminations}
                  isPickCorrect={isPickCorrect}
                  nflStats={nflStats}
                />
              ) : jsonPicks && Object.keys(jsonPicks).length > 0 ? (
                // JSON column picks display (for CFB and older events)
                <JSONPicksDisplay
                  picks={jsonPicks}
                  matchups={matchups}
                  teams={teams}
                  teamMap={teamMap}
                  categories={categories}
                />
              ) : (
                // Standard Bracket Picks Display (bracket_picks table)
                <StandardPicksDisplay
                  picks={picks}
                  matchups={matchups}
                  teams={teams}
                  teamMap={teamMap}
                  categories={categories}
                  categoryPicks={categoryPicks}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// NFL Advancement Picks Component
function NFLPicksDisplay({ picks, rounds, teams, teamMap, roundMap, eliminations, isPickCorrect, nflStats }) {
  return (
    <div>
      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        fontSize: 13,
        color: '#666'
      }}>
        <span>✅ Correct</span>
        <span>❌ Incorrect</span>
        <span>⏳ Pending</span>
      </div>

      {/* Stats Summary */}
      {nflStats && Object.keys(eliminations).length > 0 && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 24,
          padding: 16,
          background: '#f0fdf4',
          borderRadius: 8,
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>{nflStats.correct}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{nflStats.incorrect}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Wrong</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#6b7280' }}>{nflStats.pending}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Pending</div>
          </div>
        </div>
      )}

      {/* Rounds */}
      {rounds.map(round => {
        const roundPicks = picks.filter(p => p.round_id === round.id)
        const isSuperBowl = round.round_order === rounds.length

        return (
          <div key={round.id} style={{
            marginBottom: 24,
            padding: 16,
            background: isSuperBowl ? '#fef3c7' : '#f9fafb',
            borderRadius: 8,
            border: isSuperBowl ? '2px solid #f59e0b' : '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {isSuperBowl && '🏆 '}{round.name}
              </h3>
              <span style={{
                fontSize: 13,
                color: '#666',
                background: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: 12
              }}>
                {round.points} pts each
              </span>
            </div>

            {roundPicks.length === 0 ? (
              <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                No picks for this round
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {['AFC', 'NFC'].map(conf => {
                  const confPicks = roundPicks.filter(p => {
                    const team = teamMap[p.team_id]
                    return team?.conference?.toUpperCase() === conf
                  })

                  if (confPicks.length === 0 && !isSuperBowl) return null

                  return (
                    <div key={conf} style={{ flex: 1, minWidth: 200 }}>
                      {!isSuperBowl && (
                        <h4 style={{
                          margin: '0 0 8px',
                          fontSize: 13,
                          color: conf === 'AFC' ? '#dc2626' : '#2563eb'
                        }}>
                          {conf}
                        </h4>
                      )}
                      <div style={{ display: 'flex', flexDirection: isSuperBowl ? 'row' : 'column', gap: 6, flexWrap: 'wrap' }}>
                        {confPicks.map(pick => {
                          const team = teamMap[pick.team_id]
                          const correct = isPickCorrect(pick.team_id, pick.round_id)
                          const hasResults = Object.keys(eliminations).length > 0

                          return (
                            <div key={pick.id || `${pick.team_id}-${pick.round_id}`} style={{
                              padding: isSuperBowl ? '12px 20px' : '8px 12px',
                              background: hasResults
                                ? (correct === true ? '#dcfce7' : correct === false ? '#fee2e2' : 'white')
                                : 'white',
                              border: `1px solid ${
                                hasResults
                                  ? (correct === true ? '#16a34a' : correct === false ? '#ef4444' : '#d1d5db')
                                  : '#d1d5db'
                              }`,
                              borderRadius: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <span>
                                {isSuperBowl && (
                                  <span style={{
                                    fontSize: 11,
                                    color: team?.conference === 'AFC' ? '#dc2626' : '#2563eb',
                                    marginRight: 6
                                  }}>
                                    {team?.conference}
                                  </span>
                                )}
                                #{team?.seed} {team?.name}
                              </span>
                              <span>
                                {hasResults 
                                  ? (correct === true ? '✅' : correct === false ? '❌' : '⏳')
                                  : '⏳'
                                }
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Points Summary */}
      {Object.keys(eliminations).length > 0 && (
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f0fdf4',
          borderRadius: 8,
          border: '1px solid #bbf7d0'
        }}>
          <h4 style={{ margin: '0 0 12px' }}>Points Summary</h4>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {rounds.map(round => {
              const roundPicks = picks.filter(p => p.round_id === round.id)
              const correctCount = roundPicks.filter(p => 
                isPickCorrect(p.team_id, p.round_id) === true
              ).length
              const points = correctCount * round.points

              return (
                <div key={round.id} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{round.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>{points}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {correctCount}/{roundPicks.length} × {round.points}
                  </div>
                </div>
              )
            })}
            <div style={{ 
              textAlign: 'center',
              paddingLeft: 24,
              borderLeft: '2px solid #16a34a'
            }}>
              <div style={{ fontSize: 12, color: '#666' }}>Total</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                {picks.reduce((sum, pick) => {
                  const round = roundMap[pick.round_id]
                  const correct = isPickCorrect(pick.team_id, pick.round_id)
                  return sum + (correct === true ? (round?.points || 0) : 0)
                }, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// JSON Column Picks Display (for CFB and older events)
function JSONPicksDisplay({ picks, matchups, teams, teamMap, categories }) {
  // picks is an object like { matchup_id: team_id, ... } or { bracket: {...}, categories: {...} }
  
  // Handle different JSON structures
  const bracketPicks = picks.bracket || picks
  const catPicks = picks.categories || {}

  // Group matchups by round
  const matchupsByRound = {}
  matchups.forEach(m => {
    const roundName = m.round?.name || 'Unknown'
    const roundOrder = m.round?.round_order || 0
    if (!matchupsByRound[roundOrder]) {
      matchupsByRound[roundOrder] = { name: roundName, points: m.round?.points || 0, matchups: [] }
    }
    matchupsByRound[roundOrder].matchups.push(m)
  })

  return (
    <div>
      {/* Bracket Picks */}
      {Object.entries(matchupsByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundOrder, roundData]) => (
          <div key={roundOrder} style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 14,
              padding: '8px 12px',
              background: '#eff6ff',
              borderRadius: 6,
              marginBottom: 12
            }}>
              {roundData.name}
              <span style={{ fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                ({roundData.points} pts)
              </span>
            </h3>

            {roundData.matchups.map(matchup => {
              const pickedTeamId = bracketPicks[matchup.id]
              const pickedTeam = pickedTeamId ? teamMap[pickedTeamId] : null
              const winner = matchup.winner_team_id
              const isCorrect = winner && pickedTeamId === winner
              const isWrong = winner && pickedTeamId && pickedTeamId !== winner
              const teamA = teamMap[matchup.team_a_id]
              const teamB = teamMap[matchup.team_b_id]

              return (
                <div key={matchup.id} style={{
                  padding: 12,
                  marginBottom: 8,
                  background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#f9fafb',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {teamA && teamB ? (
                      `(${teamA.seed}) ${teamA.name} vs (${teamB.seed}) ${teamB.name}`
                    ) : 'TBD'}
                  </div>
                  <div style={{
                    fontWeight: 600,
                    color: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#374151'
                  }}>
                    {pickedTeam ? pickedTeam.name : '—'}
                    {winner && (isCorrect ? ' ✓' : isWrong ? ' ✗' : '')}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      {/* Category Picks from JSON */}
      {categories.length > 0 && Object.keys(catPicks).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ 
            fontSize: 14, 
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: 8,
            marginBottom: 16
          }}>
            Category Picks
          </h3>
          {categories.map(cat => {
            const pickedOptionId = catPicks[cat.id]
            const pickedOption = cat.options?.find(o => o.id === pickedOptionId)
            const correctOption = cat.options?.find(o => o.is_correct)
            const isCorrect = correctOption && pickedOptionId === correctOption.id
            const isWrong = correctOption && pickedOptionId && pickedOptionId !== correctOption.id

            return (
              <div key={cat.id} style={{
                padding: 12,
                marginBottom: 8,
                background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#f9fafb',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: '#666', fontSize: 13 }}>{cat.name}</div>
                <div style={{
                  fontWeight: 600,
                  color: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#374151'
                }}>
                  {pickedOption ? pickedOption.name : '—'}
                  {correctOption && (isCorrect ? ' ✓' : isWrong ? ' ✗' : '')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Standard Bracket Picks Component (bracket_picks table)
function StandardPicksDisplay({ picks, matchups, teams, teamMap, categories, categoryPicks }) {
  // Group matchups by round
  const matchupsByRound = {}
  matchups.forEach(m => {
    const roundName = m.round?.name || 'Unknown'
    const roundOrder = m.round?.round_order || 0
    if (!matchupsByRound[roundOrder]) {
      matchupsByRound[roundOrder] = { name: roundName, points: m.round?.points || 0, matchups: [] }
    }
    matchupsByRound[roundOrder].matchups.push(m)
  })

  const pickMap = Object.fromEntries(picks.map(p => [p.matchup_id, p.team_id]))
  const catPickMap = Object.fromEntries(categoryPicks.map(p => [p.category_id, p.option_id]))

  return (
    <div>
      {/* Bracket Picks */}
      {Object.entries(matchupsByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundOrder, roundData]) => (
          <div key={roundOrder} style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 14,
              padding: '8px 12px',
              background: '#eff6ff',
              borderRadius: 6,
              marginBottom: 12
            }}>
              {roundData.name}
              <span style={{ fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                ({roundData.points} pts)
              </span>
            </h3>

            {roundData.matchups.map(matchup => {
              const pickedTeamId = pickMap[matchup.id]
              const pickedTeam = pickedTeamId ? teamMap[pickedTeamId] : null
              const winner = matchup.winner_team_id
              const isCorrect = winner && pickedTeamId === winner
              const isWrong = winner && pickedTeamId && pickedTeamId !== winner
              const teamA = teamMap[matchup.team_a_id]
              const teamB = teamMap[matchup.team_b_id]

              return (
                <div key={matchup.id} style={{
                  padding: 12,
                  marginBottom: 8,
                  background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#f9fafb',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {teamA && teamB ? (
                      `(${teamA.seed}) ${teamA.name} vs (${teamB.seed}) ${teamB.name}`
                    ) : 'TBD'}
                  </div>
                  <div style={{
                    fontWeight: 600,
                    color: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#374151'
                  }}>
                    {pickedTeam ? pickedTeam.name : '—'}
                    {winner && (isCorrect ? ' ✓' : isWrong ? ' ✗' : '')}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      {/* Category Picks */}
      {categories.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ 
            fontSize: 14, 
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: 8,
            marginBottom: 16
          }}>
            Category Picks
          </h3>
          {categories.map(cat => {
            const pickedOptionId = catPickMap[cat.id]
            const pickedOption = cat.options?.find(o => o.id === pickedOptionId)
            const correctOption = cat.options?.find(o => o.is_correct)
            const isCorrect = correctOption && pickedOptionId === correctOption.id
            const isWrong = correctOption && pickedOptionId && pickedOptionId !== correctOption.id

            return (
              <div key={cat.id} style={{
                padding: 12,
                marginBottom: 8,
                background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#f9fafb',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: '#666', fontSize: 13 }}>{cat.name}</div>
                <div style={{
                  fontWeight: 600,
                  color: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#374151'
                }}>
                  {pickedOption ? pickedOption.name : '—'}
                  {correctOption && (isCorrect ? ' ✓' : isWrong ? ' ✗' : '')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
