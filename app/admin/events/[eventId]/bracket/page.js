'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/clients'

const supabase = getBrowserClient()
import { Card, PageHeader, Button, EmptyState, LoadingState } from '../../../../../components/ui'
import { sortBySeed, getConferences, createMap } from '../../../../../lib/utils'

export default function BracketBuilderPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [rounds, setRounds] = useState([])
  const [teams, setTeams] = useState([])
  const [matchups, setMatchups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rounds')

  const [newRound, setNewRound] = useState({ name: '', points: 1 })
  const [newTeam, setNewTeam] = useState({ name: '', seed: 1, conference: '' })

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

    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*')
      .eq('event_id', eventId)

    const teamIds = new Set()
    matchupsData?.forEach(m => {
      if (m.team_a_id) teamIds.add(m.team_a_id)
      if (m.team_b_id) teamIds.add(m.team_b_id)
    })

    let teamsData = []
    if (teamIds.size > 0) {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .in('id', Array.from(teamIds))
      teamsData = data || []
    }

    setEvent(eventData)
    setRounds(roundsData || [])
    setTeams(teamsData)
    setMatchups(matchupsData || [])
    setLoading(false)
  }

  const conferences = getConferences(teams)

  async function addRound() {
    if (!newRound.name) return
    const nextOrder = rounds.length + 1

    await supabase.from('rounds').insert({
      event_id: eventId,
      name: newRound.name,
      round_order: nextOrder,
      points: parseInt(newRound.points)
    })

    setNewRound({ name: '', points: Math.pow(2, nextOrder) })
    loadData()
  }

  async function deleteRound(id) {
    if (!confirm('Delete this round and all its matchups?')) return
    await supabase.from('rounds').delete().eq('id', id)
    loadData()
  }

  async function addTeam() {
    if (!newTeam.name || !newTeam.conference) return

    await supabase.from('teams').insert({
      name: newTeam.name,
      seed: parseInt(newTeam.seed),
      conference: newTeam.conference
    })

    setNewTeam({ name: '', seed: newTeam.seed + 1, conference: newTeam.conference })
    loadData()
  }

  async function deleteTeam(id) {
    if (!confirm('Delete this team?')) return
    await supabase.from('teams').delete().eq('id', id)
    loadData()
  }

  async function generateMatchups(roundId, conference) {
    const round = rounds.find(r => r.id === roundId)
    if (!round) return

    const confTeams = sortBySeed(teams.filter(t => t.conference === conference))

    if (round.round_order === 1) {
      const numTeams = confTeams.length
      const matchupPairs = []

      if (numTeams === 7) {
        matchupPairs.push({ a: confTeams[0], b: null, pos: 1 })
        matchupPairs.push({ a: confTeams[3], b: confTeams[4], pos: 2 })
        matchupPairs.push({ a: confTeams[2], b: confTeams[5], pos: 3 })
        matchupPairs.push({ a: confTeams[1], b: confTeams[6], pos: 4 })
      } else {
        const bracketOrder = [1, 8, 5, 4, 6, 3, 7, 2]
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
          winner_team_id: pair.b ? null : pair.a?.id,
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

  if (loading) {
    return <LoadingState message="Loading bracket..." />
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

  const teamMap = createMap(teams)
  const tabs = ['rounds', 'teams', 'matchups']

  return (
    <div>
      <PageHeader
        title="🏆 Bracket Builder"
        subtitle={event.name}
        actions={
          <Button href={`/bracket/${eventId}`} variant="success">
            View Bracket →
          </Button>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)' }}>
        {tabs.map(tab => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            style={{ textTransform: 'capitalize' }}
          >
            {tab} ({tab === 'rounds' ? rounds.length : tab === 'teams' ? teams.length : matchups.length})
          </Button>
        ))}
      </div>

      {/* ROUNDS TAB */}
      {activeTab === 'rounds' && (
        <Card>
          <h3 style={{ marginTop: 0 }}>Rounds</h3>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            Add rounds in order (Wildcard → Super Bowl)
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
            <input
              type="text"
              placeholder="Round name (e.g., Wildcard)"
              value={newRound.name}
              onChange={e => setNewRound({ ...newRound, name: e.target.value })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              placeholder="Points"
              value={newRound.points}
              onChange={e => setNewRound({ ...newRound, points: e.target.value })}
              style={{ width: 80 }}
            />
            <Button onClick={addRound} variant="success">
              Add Round
            </Button>
          </div>

          {rounds.length === 0 ? (
            <EmptyState
              icon="🔢"
              title="No rounds yet"
              description="Add your first round above"
            />
          ) : (
            rounds.map(round => (
              <div key={round.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border-light)'
              }}>
                <span>
                  <strong>{round.round_order}.</strong> {round.name} ({round.points} pts)
                </span>
                <button
                  onClick={() => deleteRound(round.id)}
                  style={{
                    color: 'var(--color-danger)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </Card>
      )}

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <Card>
          <h3 style={{ marginTop: 0 }}>Teams</h3>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Team name"
              value={newTeam.name}
              onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
              style={{ flex: 1, minWidth: 150 }}
            />
            <input
              type="number"
              placeholder="Seed"
              value={newTeam.seed}
              onChange={e => setNewTeam({ ...newTeam, seed: e.target.value })}
              style={{ width: 70 }}
            />
            <input
              type="text"
              placeholder="Conference (AFC, NFC...)"
              value={newTeam.conference}
              onChange={e => setNewTeam({ ...newTeam, conference: e.target.value })}
              style={{ width: 180 }}
            />
            <Button onClick={addTeam} variant="success">
              Add Team
            </Button>
          </div>

          {teams.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No teams yet"
              description="Add your first team above"
            />
          ) : (
            conferences.map(conf => (
              <div key={conf} style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h4 style={{ color: 'var(--color-text-light)' }}>{conf}</h4>
                {sortBySeed(teams.filter(t => t.conference === conf)).map(team => (
                  <div key={team.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-sm)',
                    borderBottom: '1px solid var(--color-border-light)'
                  }}>
                    <span>#{team.seed} {team.name}</span>
                    <button
                      onClick={() => deleteTeam(team.id)}
                      style={{
                        color: 'var(--color-danger)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </Card>
      )}

      {/* MATCHUPS TAB */}
      {activeTab === 'matchups' && (
        <Card>
          <h3 style={{ marginTop: 0 }}>Matchups</h3>

          {rounds.length > 0 && conferences.length > 0 && (
            <div style={{
              marginBottom: 'var(--spacing-xl)',
              padding: 'var(--spacing-lg)',
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                <strong>Auto-generate first round matchups:</strong>
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {conferences.map(conf => (
                  <Button
                    key={conf}
                    onClick={() => generateMatchups(rounds[0]?.id, conf)}
                    variant="primary"
                    size="sm"
                  >
                    Generate {conf}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {matchups.length === 0 ? (
            <EmptyState
              icon="⚔️"
              title="No matchups yet"
              description="Add rounds and teams first, then generate matchups"
            />
          ) : (
            rounds.map(round => {
              const roundMatchups = matchups
                .filter(m => m.round_id === round.id)
                .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))

              if (roundMatchups.length === 0) return null

              return (
                <div key={round.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <h4>{round.name}</h4>
                  {roundMatchups.map(m => {
                    const teamA = teamMap[m.team_a_id]
                    const teamB = teamMap[m.team_b_id]
                    const winner = teamMap[m.winner_team_id]

                    return (
                      <div key={m.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-sm)',
                        borderBottom: '1px solid var(--color-border-light)'
                      }}>
                        <span style={{ width: 30, color: 'var(--color-text-muted)' }}>
                          #{m.bracket_position}
                        </span>
                        <span style={{ flex: 1 }}>
                          <strong>{teamB ? `#${teamB.seed} ${teamB.name}` : 'BYE'}</strong>
                          {' vs '}
                          <strong>#{teamA?.seed} {teamA?.name}</strong>
                          {winner && (
                            <span style={{ color: 'var(--color-success)', marginLeft: 'var(--spacing-sm)' }}>
                              → {winner.name}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => deleteMatchup(m.id)}
                          style={{
                            color: 'var(--color-danger)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </Card>
      )}
    </div>
  )
}