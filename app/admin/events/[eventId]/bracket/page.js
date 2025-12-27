'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

export default function BracketBuilderPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [rounds, setRounds] = useState([])
  const [teams, setTeams] = useState([])
  const [matchups, setMatchups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rounds')

  // Form states
  const [newRound, setNewRound] = useState({ name: '', points: 1 })
  const [newTeam, setNewTeam] = useState({ name: '', seed: 1, conference: '' })
  const [conferences, setConferences] = useState([])

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
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

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .in('id', await getTeamIdsForEvent())

    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*')
      .eq('event_id', eventId)

    setEvent(eventData)
    setRounds(roundsData || [])
    setTeams(teamsData || [])
    setMatchups(matchupsData || [])
    
    const confs = [...new Set(teamsData?.map(t => t.conference).filter(Boolean))]
    setConferences(confs)
    
    setLoading(false)
  }

  async function getTeamIdsForEvent() {
    const { data } = await supabase
      .from('matchups')
      .select('team_a_id, team_b_id')
      .eq('event_id', eventId)
    
    const ids = new Set()
    data?.forEach(m => {
      if (m.team_a_id) ids.add(m.team_a_id)
      if (m.team_b_id) ids.add(m.team_b_id)
    })
    return Array.from(ids)
  }

  // ROUNDS
  async function addRound() {
    if (!newRound.name) return
    const nextOrder = rounds.length + 1
    
    await supabase.from('rounds').insert({
      event_id: eventId,
      name: newRound.name,
      round_order: nextOrder,
      points: parseInt(newRound.points)
    })
    
    setNewRound({ name: '', points: Math.pow(2, nextOrder - 1) })
    loadData()
  }

  async function deleteRound(id) {
    if (!confirm('Delete this round and all its matchups?')) return
    await supabase.from('rounds').delete().eq('id', id)
    loadData()
  }

  // TEAMS
  async function addTeam() {
    if (!newTeam.name || !newTeam.conference) return
    
    const { data: team } = await supabase
      .from('teams')
      .insert({
        name: newTeam.name,
        seed: parseInt(newTeam.seed),
        conference: newTeam.conference
      })
      .select()
      .single()
    
    setNewTeam({ name: '', seed: newTeam.seed + 1, conference: newTeam.conference })
    loadData()
  }

  async function deleteTeam(id) {
    if (!confirm('Delete this team?')) return
    await supabase.from('teams').delete().eq('id', id)
    loadData()
  }

  // MATCHUPS
  async function generateMatchups(roundId, conference) {
    const round = rounds.find(r => r.id === roundId)
    if (!round) return

    const confTeams = teams
      .filter(t => t.conference === conference)
      .sort((a, b) => a.seed - b.seed)

    if (round.round_order === 1) {
      // First round: pair by seed (1v8, 2v7, etc or 1vBYE, 4v5, 3v6, 2v7)
      const numTeams = confTeams.length
      const matchupPairs = []

      if (numTeams === 7) {
        // NFL style: 1 has bye, then 4v5, 3v6, 2v7
        matchupPairs.push({ a: confTeams[0], b: null, pos: 1 }) // #1 bye
        matchupPairs.push({ a: confTeams[3], b: confTeams[4], pos: 2 }) // 4v5
        matchupPairs.push({ a: confTeams[2], b: confTeams[5], pos: 3 }) // 3v6
        matchupPairs.push({ a: confTeams[1], b: confTeams[6], pos: 4 }) // 2v7
      } else {
        // Standard bracket: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
        const bracketOrder = [1, 8, 5, 4, 6, 3, 7, 2] // Position of higher seed
        for (let i = 0; i < numTeams / 2; i++) {
          const highSeed = bracketOrder[i] - 1
          const lowSeed = numTeams - bracketOrder[i]
          if (confTeams[highSeed] && confTeams[lowSeed]) {
            matchupPairs.push({ 
              a: confTeams[highSeed], 
              b: confTeams[lowSeed], 
              pos: i + 1 
            })
          }
        }
      }

      for (const pair of matchupPairs) {
        await supabase.from('matchups').insert({
          event_id: eventId,
          round_id: roundId,
          team_a_id: pair.a?.id,
          team_b_id: pair.b?.id,
          winner_team_id: pair.b ? null : pair.a?.id, // Auto-win for bye
          bracket_position: pair.pos
        })
      }
    }

    loadData()
  }

  async function deleteMatchup(id) {
    if (!confirm('Delete this matchup?')) return
    await supabase.from('matchups').delete().eq('id', id)
    loadData()
  }

  async function setMatchupWinner(matchupId, teamId) {
    await supabase
      .from('matchups')
      .update({ winner_team_id: teamId })
      .eq('id', matchupId)
    loadData()
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!event) return <div style={{ padding: 24 }}>Event not found</div>

  const teamMap = {}
  teams.forEach(t => teamMap[t.id] = t)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: '#0070f3' }}>← Back to Admin</Link>
      </div>

      <h1>🏆 Bracket Builder</h1>
      <h2 style={{ color: '#666' }}>{event.name}</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, marginTop: 24 }}>
        {['rounds', 'teams', 'matchups'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
              background: activeTab === tab ? '#0070f3' : '#eee',
              color: activeTab === tab ? 'white' : '#333',
              textTransform: 'capitalize'
            }}
          >
            {tab} ({tab === 'rounds' ? rounds.length : tab === 'teams' ? teams.length : matchups.length})
          </button>
        ))}
        <Link
          href={`/bracket/${eventId}`}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            borderRadius: 8,
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}
        >
          View Bracket →
        </Link>
      </div>

      {/* ROUNDS TAB */}
      {activeTab === 'rounds' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Rounds</h3>
          <p style={{ color: '#666', marginBottom: 16 }}>Add rounds in order (Wildcard → Super Bowl)</p>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Round name (e.g., Wildcard)"
              value={newRound.name}
              onChange={e => setNewRound({ ...newRound, name: e.target.value })}
              style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <input
              type="number"
              placeholder="Points"
              value={newRound.points}
              onChange={e => setNewRound({ ...newRound, points: e.target.value })}
              style={{ width: 80, padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <button
              onClick={addRound}
              style={{ padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Add Round
            </button>
          </div>

          {rounds.map(round => (
            <div key={round.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #eee' }}>
              <span><strong>{round.round_order}.</strong> {round.name} ({round.points} pts)</span>
              <button onClick={() => deleteRound(round.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
          ))}

          {rounds.length === 0 && <p style={{ color: '#999' }}>No rounds yet</p>}
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Teams</h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Team name"
              value={newTeam.name}
              onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
              style={{ flex: 1, minWidth: 150, padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <input
              type="number"
              placeholder="Seed"
              value={newTeam.seed}
              onChange={e => setNewTeam({ ...newTeam, seed: e.target.value })}
              style={{ width: 70, padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <input
              type="text"
              placeholder="Conference (AFC, NFC, East...)"
              value={newTeam.conference}
              onChange={e => setNewTeam({ ...newTeam, conference: e.target.value })}
              style={{ width: 180, padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <button
              onClick={addTeam}
              style={{ padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Add Team
            </button>
          </div>

          {conferences.map(conf => (
            <div key={conf} style={{ marginBottom: 24 }}>
              <h4 style={{ color: '#666' }}>{conf}</h4>
              {teams.filter(t => t.conference === conf).sort((a,b) => a.seed - b.seed).map(team => (
                <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
                  <span>#{team.seed} {team.name}</span>
                  <button onClick={() => deleteTeam(team.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          ))}

          {teams.length === 0 && <p style={{ color: '#999' }}>No teams yet</p>}
        </div>
      )}

      {/* MATCHUPS TAB */}
      {activeTab === 'matchups' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Matchups</h3>
          
          {rounds.length > 0 && conferences.length > 0 && (
            <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <p style={{ marginBottom: 12 }}><strong>Auto-generate first round matchups:</strong></p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {conferences.map(conf => (
                  <button
                    key={conf}
                    onClick={() => generateMatchups(rounds[0]?.id, conf)}
                    style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Generate {conf}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rounds.map(round => {
            const roundMatchups = matchups
              .filter(m => m.round_id === round.id)
              .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))
            
            return (
              <div key={round.id} style={{ marginBottom: 24 }}>
                <h4>{round.name}</h4>
                {roundMatchups.length === 0 ? (
                  <p style={{ color: '#999' }}>No matchups</p>
                ) : (
                  roundMatchups.map(m => {
                    const teamA = teamMap[m.team_a_id]
                    const teamB = teamMap[m.team_b_id]
                    const winner = teamMap[m.winner_team_id]
                    
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderBottom: '1px solid #eee' }}>
                        <span style={{ width: 30, color: '#999' }}>#{m.bracket_position}</span>
                        <span style={{ flex: 1 }}>
                          <strong>{teamB ? `#${teamB.seed} ${teamB.name}` : 'BYE'}</strong>
                          {' vs '}
                          <strong>#{teamA?.seed} {teamA?.name}</strong>
                          {winner && <span style={{ color: '#28a745', marginLeft: 8 }}>→ {winner.name}</span>}
                        </span>
                        <button onClick={() => deleteMatchup(m.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}