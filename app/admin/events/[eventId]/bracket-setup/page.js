'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// Bye Team Setup Component
function ByeTeamSetup({ eventId, rounds, matchups, teams, onUpdate, supabase }) {
  const [saving, setSaving] = useState(false)
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedMatchup, setSelectedMatchup] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('a')

  // Get rounds after first (where byes would go)
  const laterRounds = rounds.filter(r => r.round_order > 1)

  // Get matchups for selected round
  const roundMatchups = matchups
    .filter(m => m.round_id === selectedRound)
    .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))

  async function handleSetBye() {
    if (!selectedMatchup || !selectedTeam) {
      alert('Select a matchup and team')
      return
    }

    setSaving(true)

    const updateData = selectedSlot === 'a' 
      ? { team_a_id: selectedTeam }
      : { team_b_id: selectedTeam }

    const { error } = await supabase
      .from('matchups')
      .update(updateData)
      .eq('id', selectedMatchup)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Bye team set!')
      setSelectedMatchup('')
      setSelectedTeam('')
      onUpdate()
    }

    setSaving(false)
  }

  async function handleClearBye(matchupId, slot) {
    if (!confirm('Clear this bye team?')) return

    setSaving(true)

    const updateData = slot === 'a' 
      ? { team_a_id: null }
      : { team_b_id: null }

    await supabase
      .from('matchups')
      .update(updateData)
      .eq('id', matchupId)

    onUpdate()
    setSaving(false)
  }

  // Find existing byes (teams in later rounds that aren't from advancement)
  const existingByes = []
  laterRounds.forEach(round => {
    const roundMs = matchups.filter(m => m.round_id === round.id)
    roundMs.forEach(m => {
      if (m.team_a_id) {
        const team = teams.find(t => t.id === m.team_a_id)
        existingByes.push({
          matchupId: m.id,
          roundName: round.name,
          position: m.bracket_position,
          slot: 'a',
          team
        })
      }
      if (m.team_b_id) {
        const team = teams.find(t => t.id === m.team_b_id)
        existingByes.push({
          matchupId: m.id,
          roundName: round.name,
          position: m.bracket_position,
          slot: 'b',
          team
        })
      }
    })
  })

  const getTeamLabel = (team) => {
    if (!team) return 'Unknown'
    return team.seed ? `#${team.seed} ${team.name}` : team.name
  }

  return (
    <div style={{
      background: '#faf5ff',
      border: '2px solid #c4b5fd',
      borderRadius: 12,
      padding: 20,
      marginBottom: 32
    }}>
      <h3 style={{ margin: '0 0 8px', color: '#7c3aed' }}>🎫 Bye Team Setup</h3>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
        For tournaments where top seeds skip early rounds (like CFB Playoff), 
        set bye teams in later round matchups. Winners will fill the empty slot.
      </p>

      {/* Existing Byes */}
      {existingByes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Current Byes:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {existingByes.map((bye, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'white',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 13
              }}>
                <span>
                  <strong>{getTeamLabel(bye.team)}</strong>
                  <span style={{ color: '#666' }}> → {bye.roundName} Pos {bye.position} (Team {bye.slot.toUpperCase()})</span>
                </span>
                <button
                  onClick={() => handleClearBye(bye.matchupId, bye.slot)}
                  disabled={saving}
                  style={{
                    padding: '2px 6px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bye Form */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        flexWrap: 'wrap', 
        alignItems: 'flex-end',
        padding: 16,
        background: 'white',
        borderRadius: 8
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#666' }}>Round</label>
          <select
            value={selectedRound}
            onChange={(e) => { setSelectedRound(e.target.value); setSelectedMatchup(''); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 150 }}
          >
            <option value="">Select round...</option>
            {laterRounds.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#666' }}>Matchup</label>
          <select
            value={selectedMatchup}
            onChange={(e) => setSelectedMatchup(e.target.value)}
            disabled={!selectedRound}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 150 }}
          >
            <option value="">Select matchup...</option>
            {roundMatchups.map(m => (
              <option key={m.id} value={m.id}>Position {m.bracket_position || '?'}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#666' }}>Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 100 }}
          >
            <option value="a">Team A</option>
            <option value="b">Team B</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#666' }}>Bye Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 180 }}
          >
            <option value="">Select team...</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{getTeamLabel(t)}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSetBye}
          disabled={saving || !selectedMatchup || !selectedTeam}
          style={{
            padding: '8px 20px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {saving ? '...' : 'Set Bye'}
        </button>
      </div>

      {/* Help Text */}
      <p style={{ margin: '16px 0 0', fontSize: 12, color: '#7c3aed' }}>
        💡 <strong>Tip:</strong> For CFB Playoff, set #1, #2, #3, #4 seeds as byes in Quarterfinals. 
        When First Round winners advance, they'll fill the empty slot to face the bye team.
      </p>
    </div>
  )
}

export default function BracketSetupPage({ params }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error('Missing Supabase environment variables')
      return null
    }
    return createClient(url, key)
  }, [])

  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [rounds, setRounds] = useState([])
  const [matchups, setMatchups] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')

    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*, round:rounds(name, round_order)')
      .eq('event_id', eventId)
      .order('bracket_position')

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('seed')

    setEvent(eventData)
    setRounds(roundsData || [])
    setMatchups(matchupsData || [])
    setTeams(teamsData || [])
    setLoading(false)
  }

  // Generate standard bracket structure
  async function generateBracketStructure() {
    if (!confirm('This will create empty matchups for all rounds. Continue?')) return

    setGenerating(true)

    // Calculate matchups needed per round
    // For a bracket, each round has half the matchups of the previous
    const roundMatchups = []
    
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i]
      // Count existing matchups in this round
      const existingInRound = matchups.filter(m => m.round_id === round.id).length
      
      // First round: based on teams or existing matchups
      let neededMatchups
      if (i === 0) {
        // First round should have enough matchups for all teams
        neededMatchups = Math.max(existingInRound, Math.ceil(teams.length / 2))
      } else {
        // Later rounds: half of previous round
        const prevNeeded = roundMatchups[i - 1]
        neededMatchups = Math.ceil(prevNeeded / 2)
      }
      
      roundMatchups.push(neededMatchups)
    }

    // Create missing matchups with bracket_position
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i]
      const existingMatchups = matchups.filter(m => m.round_id === round.id)
      const existingPositions = new Set(existingMatchups.map(m => m.bracket_position).filter(Boolean))
      
      const needed = roundMatchups[i]
      
      for (let pos = 1; pos <= needed; pos++) {
        // Skip if this position already exists
        if (existingPositions.has(pos)) continue
        
        // Check if there's a matchup without position we can update
        const unpositioned = existingMatchups.find(m => !m.bracket_position)
        
        if (unpositioned) {
          // Update existing matchup with position
          await supabase
            .from('matchups')
            .update({ bracket_position: pos })
            .eq('id', unpositioned.id)
        } else {
          // Create new empty matchup
          await supabase
            .from('matchups')
            .insert({
              event_id: eventId,
              round_id: round.id,
              bracket_position: pos,
              team_a_id: null,
              team_b_id: null
            })
        }
      }
    }

    await loadData()
    setGenerating(false)
    alert('Bracket structure generated!')
  }

  // Fix bracket positions on existing matchups
  async function fixBracketPositions() {
    if (!confirm('This will assign bracket_position to matchups that are missing them. Continue?')) return

    setGenerating(true)

    for (const round of rounds) {
      const roundMatchups = matchups
        .filter(m => m.round_id === round.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

      for (let i = 0; i < roundMatchups.length; i++) {
        const matchup = roundMatchups[i]
        if (!matchup.bracket_position) {
          await supabase
            .from('matchups')
            .update({ bracket_position: i + 1 })
            .eq('id', matchup.id)
        }
      }
    }

    await loadData()
    setGenerating(false)
    alert('Bracket positions fixed!')
  }

  // Clear all advancement (reset teams in later rounds)
  async function clearAdvancement() {
    if (!confirm('This will clear ALL teams from rounds 2+ (including byes). Continue?')) return
    if (!confirm('Are you sure? This resets the bracket completely.')) return

    setGenerating(true)

    // Get rounds after first
    const laterRounds = rounds.filter(r => r.round_order > 1)
    
    for (const round of laterRounds) {
      const roundMatchups = matchups.filter(m => m.round_id === round.id)
      
      for (const matchup of roundMatchups) {
        await supabase
          .from('matchups')
          .update({ 
            team_a_id: null, 
            team_b_id: null, 
            winner_team_id: null 
          })
          .eq('id', matchup.id)
      }
    }

    // Also clear winners from round 1
    const round1 = rounds.find(r => r.round_order === 1)
    if (round1) {
      const round1Matchups = matchups.filter(m => m.round_id === round1.id)
      for (const matchup of round1Matchups) {
        await supabase
          .from('matchups')
          .update({ winner_team_id: null })
          .eq('id', matchup.id)
      }
    }

    await loadData()
    setGenerating(false)
    alert('Bracket reset completely!')
  }

  // Clear only winners, preserving bye teams in later rounds
  async function clearWinnersOnly() {
    if (!confirm('This will clear all WINNERS but keep bye teams. Continue?')) return

    setGenerating(true)

    // Clear winners from all rounds
    for (const matchup of matchups) {
      if (matchup.winner_team_id) {
        await supabase
          .from('matchups')
          .update({ winner_team_id: null })
          .eq('id', matchup.id)
      }
    }

    // For rounds 2+, clear only the teams that came from advancement (not byes)
    // We determine this by checking: if a team is in round 2+, and that team 
    // also appears in an earlier round, it's from advancement (not a bye)
    const round1 = rounds.find(r => r.round_order === 1)
    const round1TeamIds = new Set()
    
    if (round1) {
      const round1Matchups = matchups.filter(m => m.round_id === round1.id)
      round1Matchups.forEach(m => {
        if (m.team_a_id) round1TeamIds.add(m.team_a_id)
        if (m.team_b_id) round1TeamIds.add(m.team_b_id)
      })
    }

    // Clear advanced teams from later rounds (teams that were in round 1)
    const laterRounds = rounds.filter(r => r.round_order > 1)
    
    for (const round of laterRounds) {
      const roundMatchups = matchups.filter(m => m.round_id === round.id)
      
      for (const matchup of roundMatchups) {
        const updates = {}
        
        // If team_a was in round 1, it's from advancement - clear it
        if (matchup.team_a_id && round1TeamIds.has(matchup.team_a_id)) {
          updates.team_a_id = null
        }
        // If team_b was in round 1, it's from advancement - clear it
        if (matchup.team_b_id && round1TeamIds.has(matchup.team_b_id)) {
          updates.team_b_id = null
        }
        
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('matchups')
            .update(updates)
            .eq('id', matchup.id)
        }
      }
    }

    await loadData()
    setGenerating(false)
    alert('Winners cleared, bye teams preserved!')
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  // Group matchups by round
  const matchupsByRound = rounds.map(round => ({
    round,
    matchups: matchups
      .filter(m => m.round_id === round.id)
      .sort((a, b) => (a.bracket_position || 99) - (b.bracket_position || 99))
  }))

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return '(TBD)'
    return team.seed ? `#${team.seed} ${team.name}` : team.name
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Link href={`/admin/events/${eventId}/matchups`} style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Matchups
      </Link>

      <h1 style={{ marginTop: 16 }}>🔧 Bracket Setup</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{event?.name} {event?.year}</p>

      {/* Warning Box */}
      <div style={{
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24
      }}>
        <h3 style={{ margin: '0 0 8px' }}>⚠️ Bracket Advancement Requirements</h3>
        <p style={{ margin: '0 0 12px', fontSize: 14 }}>
          For winners to advance correctly, you need:
        </p>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
          <li><strong>Rounds with round_order</strong> - 1, 2, 3, 4...</li>
          <li><strong>Matchups in ALL rounds</strong> - including empty later rounds</li>
          <li><strong>bracket_position on each matchup</strong> - 1, 2, 3, 4...</li>
        </ol>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#92400e' }}>
          Position 1 & 2 winners → Next round Position 1 (Team A & B)<br/>
          Position 3 & 4 winners → Next round Position 2 (Team A & B)
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <button
          onClick={fixBracketPositions}
          disabled={generating}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {generating ? '...' : '1️⃣ Fix Bracket Positions'}
        </button>
        
        <button
          onClick={generateBracketStructure}
          disabled={generating}
          style={{
            padding: '12px 24px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {generating ? '...' : '2️⃣ Generate Empty Matchups'}
        </button>

        <button
          onClick={clearWinnersOnly}
          disabled={generating}
          style={{
            padding: '12px 24px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {generating ? '...' : '🧹 Clear Winners (Keep Byes)'}
        </button>

        <button
          onClick={clearAdvancement}
          disabled={generating}
          style={{
            padding: '12px 24px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {generating ? '...' : '🔄 Reset All'}
        </button>
      </div>

      {/* BYE TEAM SETUP */}
      {rounds.length > 1 && teams.length > 0 && (
        <ByeTeamSetup
          eventId={eventId}
          rounds={rounds}
          matchups={matchups}
          teams={teams}
          onUpdate={loadData}
          supabase={supabase}
        />
      )}

      {/* Current Bracket Structure */}
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Current Bracket Structure</h2>
      
      {rounds.length === 0 ? (
        <div style={{ padding: 24, background: '#fee2e2', borderRadius: 8, color: '#dc2626' }}>
          <strong>No rounds created!</strong> Go to Rounds tab first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {matchupsByRound.map(({ round, matchups: roundMatchups }) => (
            <div key={round.id} style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>
                  {round.name}
                  <span style={{ 
                    marginLeft: 8, 
                    fontSize: 12, 
                    background: '#dbeafe', 
                    color: '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    round_order: {round.round_order}
                  </span>
                </h3>
                <span style={{
                  padding: '4px 12px',
                  background: '#dcfce7',
                  color: '#166534',
                  borderRadius: 12,
                  fontSize: 13
                }}>
                  {round.points} pts
                </span>
              </div>

              {roundMatchups.length === 0 ? (
                <p style={{ color: '#999', fontSize: 14 }}>No matchups in this round</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {roundMatchups.map((matchup, idx) => {
                    const hasPosition = matchup.bracket_position != null
                    const hasTeams = matchup.team_a_id || matchup.team_b_id
                    const feedsTo = Math.ceil((matchup.bracket_position || idx + 1) / 2)
                    const isTeamA = (matchup.bracket_position || idx + 1) % 2 === 1

                    return (
                      <div 
                        key={matchup.id}
                        style={{
                          padding: 12,
                          background: hasPosition ? 'white' : '#fef2f2',
                          borderRadius: 6,
                          border: `1px solid ${hasPosition ? '#e5e7eb' : '#fca5a5'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {hasPosition ? (
                              <span style={{ color: '#16a34a' }}>✓ Position {matchup.bracket_position}</span>
                            ) : (
                              <span style={{ color: '#dc2626' }}>⚠️ No position!</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                            {getTeamName(matchup.team_a_id)} vs {getTeamName(matchup.team_b_id)}
                            {matchup.winner_team_id && (
                              <span style={{ color: '#16a34a', marginLeft: 8 }}>
                                → Winner: {getTeamName(matchup.winner_team_id)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {round.round_order < rounds.length && (
                          <div style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
                            Feeds to: Round {round.round_order + 1}, Pos {feedsTo}
                            <br/>
                            <span style={{ color: '#999' }}>
                              ({isTeamA ? 'Team A' : 'Team B'} slot)
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Summary</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
          <li>Rounds: {rounds.length}</li>
          <li>Teams: {teams.length}</li>
          <li>Total Matchups: {matchups.length}</li>
          <li>Matchups with position: {matchups.filter(m => m.bracket_position).length}</li>
          <li>Matchups missing position: {matchups.filter(m => !m.bracket_position).length}</li>
        </ul>
      </div>
    </div>
  )
}
