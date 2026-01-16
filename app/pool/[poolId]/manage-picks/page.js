'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function ManageBracketPicksPage({ params }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error('Missing Supabase environment variables')
      return null
    }
    return createClient(url, key)
  }, [])

  const [poolId, setPoolId] = useState(null)
  const [pool, setPool] = useState(null)
  const [entries, setEntries] = useState([])
  const [matchups, setMatchups] = useState([])
  const [picks, setPicks] = useState({}) // { entryId: { matchupId: teamId } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    params.then(p => setPoolId(p.poolId))
  }, [params])

  useEffect(() => {
    if (poolId) loadData()
  }, [poolId])

  async function loadData() {
    setLoading(true)

    // Get pool with event
    const { data: poolData } = await supabase
      .from('pools')
      .select(`
        id, name, 
        event:events(id, name, year, event_type)
      `)
      .eq('id', poolId)
      .single()

    if (!poolData) {
      setLoading(false)
      return
    }

    // Get entries
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select('id, entry_name, display_name, email')
      .eq('pool_id', poolId)
      .order('entry_name')

    // Get all matchups with rounds and teams
    const { data: matchupsData } = await supabase
      .from('matchups')
      .select(`
        id, bracket_position,
        round:rounds(id, name, round_order, points),
        team_a:teams!matchups_team_a_id_fkey(id, name, seed),
        team_b:teams!matchups_team_b_id_fkey(id, name, seed),
        winner:teams!matchups_winner_team_id_fkey(id, name)
      `)
      .eq('event_id', poolData.event.id)
      .order('bracket_position')

    // Get all existing picks
    const { data: picksData } = await supabase
      .from('bracket_picks')
      .select('id, entry_id, matchup_id, team_id')
      .in('entry_id', entriesData?.map(e => e.id) || [])

    // Organize picks by entry and matchup
    const picksMap = {}
    entriesData?.forEach(entry => {
      picksMap[entry.id] = {}
    })
    picksData?.forEach(pick => {
      if (picksMap[pick.entry_id]) {
        picksMap[pick.entry_id][pick.matchup_id] = pick.team_id
      }
    })

    // Sort matchups by round order
    const sortedMatchups = (matchupsData || []).sort((a, b) => {
      const roundDiff = (a.round?.round_order || 0) - (b.round?.round_order || 0)
      if (roundDiff !== 0) return roundDiff
      return (a.bracket_position || 0) - (b.bracket_position || 0)
    })

    setPool(poolData)
    setEntries(entriesData || [])
    setMatchups(sortedMatchups)
    setPicks(picksMap)
    setLoading(false)
  }

  // Get all teams for this event (for dropdown)
  const [allTeams, setAllTeams] = useState([])
  
  useEffect(() => {
    if (pool?.event?.id) {
      supabase
        .from('teams')
        .select('id, name, seed')
        .eq('event_id', pool.event.id)
        .order('seed')
        .then(({ data }) => setAllTeams(data || []))
    }
  }, [pool])

  async function handlePickChange(entryId, matchupId, teamId) {
    // Update local state
    setPicks(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [matchupId]: teamId || null
      }
    }))
  }

  async function savePicks(entryId) {
    setSaving(true)
    const entryPicks = picks[entryId] || {}
    
    let errors = []
    
    for (const [matchupId, teamId] of Object.entries(entryPicks)) {
      if (!teamId) continue
      
      // Check if pick exists
      const { data: existing } = await supabase
        .from('bracket_picks')
        .select('id')
        .eq('entry_id', entryId)
        .eq('matchup_id', matchupId)
        .single()

      if (existing) {
        // Update
        const { error } = await supabase
          .from('bracket_picks')
          .update({ team_id: teamId })
          .eq('id', existing.id)
        
        if (error) errors.push(error.message)
      } else {
        // Insert
        const { error } = await supabase
          .from('bracket_picks')
          .insert({
            entry_id: entryId,
            matchup_id: matchupId,
            team_id: teamId
          })
        
        if (error) errors.push(error.message)
      }
    }

    setSaving(false)
    
    if (errors.length > 0) {
      alert('Errors:\n' + errors.join('\n'))
    } else {
      alert('Picks saved!')
    }
  }

  async function saveAllPicks() {
    if (!confirm('Save all picks for all entries?')) return
    
    setSaving(true)
    
    for (const entry of entries) {
      const entryPicks = picks[entry.id] || {}
      
      for (const [matchupId, teamId] of Object.entries(entryPicks)) {
        if (!teamId) continue
        
        const { data: existing } = await supabase
          .from('bracket_picks')
          .select('id')
          .eq('entry_id', entry.id)
          .eq('matchup_id', matchupId)
          .single()

        if (existing) {
          await supabase
            .from('bracket_picks')
            .update({ team_id: teamId })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('bracket_picks')
            .insert({
              entry_id: entry.id,
              matchup_id: matchupId,
              team_id: teamId
            })
        }
      }
    }
    
    setSaving(false)
    alert('All picks saved!')
    loadData()
  }

  const getTeamLabel = (team) => {
    if (!team) return '(TBD)'
    return team.seed ? `#${team.seed} ${team.name}` : team.name
  }

  // Group matchups by round
  const matchupsByRound = matchups.reduce((acc, m) => {
    const roundName = m.round?.name || 'Unknown'
    if (!acc[roundName]) acc[roundName] = []
    acc[roundName].push(m)
    return acc
  }, {})

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Link href={`/pool/${poolId}/manage`} style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Pool Manage
      </Link>

      <h1 style={{ marginTop: 16 }}>🔧 Manage Bracket Picks</h1>
      <p style={{ color: '#666', marginBottom: 8 }}>{pool.name}</p>
      <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>
        {pool.event?.name} {pool.event?.year}
      </p>

      {/* Warning */}
      <div style={{
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#92400e' }}>⚠️ Admin Override</h3>
        <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
          Use this to manually add or edit bracket picks. This bypasses normal submission rules.
          Only use when users couldn't make picks due to setup issues.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 24,
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8
      }}>
        <div>
          <strong>{entries.length}</strong> entries
        </div>
        <div>
          <strong>{matchups.length}</strong> matchups
        </div>
        <div>
          <strong>{Object.keys(matchupsByRound).length}</strong> rounds
        </div>
      </div>

      {/* Entry Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Select Entry to Edit:
        </label>
        <select
          value={selectedEntry || ''}
          onChange={(e) => setSelectedEntry(e.target.value || null)}
          style={{
            padding: '10px 16px',
            fontSize: 16,
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            minWidth: 300
          }}
        >
          <option value="">-- Select an entry --</option>
          {entries.map(entry => (
            <option key={entry.id} value={entry.id}>
              {entry.display_name || entry.entry_name} ({entry.email})
            </option>
          ))}
        </select>
      </div>

      {/* Picks Editor */}
      {selectedEntry && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>
              Editing: {entries.find(e => e.id === selectedEntry)?.display_name || entries.find(e => e.id === selectedEntry)?.entry_name}
            </h2>
            <button
              onClick={() => savePicks(selectedEntry)}
              disabled={saving}
              style={{
                padding: '10px 24px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save This Entry\'s Picks'}
            </button>
          </div>

          {Object.entries(matchupsByRound).map(([roundName, roundMatchups]) => (
            <div key={roundName} style={{ marginBottom: 24 }}>
              <h3 style={{
                margin: '0 0 12px',
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: 6,
                fontSize: 14
              }}>
                {roundName}
                <span style={{ marginLeft: 8, color: '#666', fontWeight: 'normal' }}>
                  ({roundMatchups[0]?.round?.points} pts each)
                </span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {roundMatchups.map(matchup => {
                  const currentPick = picks[selectedEntry]?.[matchup.id]
                  const hasTeams = matchup.team_a || matchup.team_b

                  return (
                    <div
                      key={matchup.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 12,
                        background: currentPick ? '#f0fdf4' : '#fafafa',
                        borderRadius: 8,
                        border: `1px solid ${currentPick ? '#bbf7d0' : '#e5e7eb'}`
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 500 }}>
                          {getTeamLabel(matchup.team_a)} vs {getTeamLabel(matchup.team_b)}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Position {matchup.bracket_position}
                          {matchup.winner && (
                            <span style={{ marginLeft: 8, color: '#16a34a' }}>
                              ✓ Winner: {matchup.winner.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                          Pick:
                        </label>
                        <select
                          value={currentPick || ''}
                          onChange={(e) => handlePickChange(selectedEntry, matchup.id, e.target.value || null)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            minWidth: 180
                          }}
                        >
                          <option value="">-- No pick --</option>
                          {/* Show matchup teams first */}
                          {matchup.team_a && (
                            <option value={matchup.team_a.id}>
                              {getTeamLabel(matchup.team_a)}
                            </option>
                          )}
                          {matchup.team_b && (
                            <option value={matchup.team_b.id}>
                              {getTeamLabel(matchup.team_b)}
                            </option>
                          )}
                          {/* Show all teams if matchup doesn't have teams set */}
                          {!hasTeams && allTeams.map(team => (
                            <option key={team.id} value={team.id}>
                              {getTeamLabel(team)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk view / edit all */}
      {!selectedEntry && (
        <div style={{
          background: '#f9fafb',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 16px' }}>All Entries Overview</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                    Matchup
                  </th>
                  {entries.map(entry => (
                    <th key={entry.id} style={{ padding: 8, textAlign: 'center', borderBottom: '2px solid #e5e7eb', minWidth: 100 }}>
                      {entry.display_name || entry.entry_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchups.map(matchup => (
                  <tr key={matchup.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{matchup.round?.name}</div>
                      <div>{getTeamLabel(matchup.team_a)} vs {getTeamLabel(matchup.team_b)}</div>
                    </td>
                    {entries.map(entry => {
                      const pick = picks[entry.id]?.[matchup.id]
                      const pickedTeam = allTeams.find(t => t.id === pick)
                      const isCorrect = matchup.winner && pick === matchup.winner.id
                      const isWrong = matchup.winner && pick && pick !== matchup.winner.id

                      return (
                        <td 
                          key={entry.id} 
                          style={{ 
                            padding: 8, 
                            textAlign: 'center',
                            background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : 'transparent'
                          }}
                        >
                          {pickedTeam ? pickedTeam.name : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        gap: 16,
        justifyContent: 'center'
      }}>
        <Link
          href={`/pool/${poolId}/standings`}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          View Standings
        </Link>
        <Link
          href={`/pool/${poolId}/picks`}
          style={{
            padding: '10px 20px',
            background: '#e5e7eb',
            color: '#374151',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          View All Picks
        </Link>
      </div>
    </div>
  )
}
