'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BracketView({ event, rounds, matchups, teams, conferences }) {
  const [activeConference, setActiveConference] = useState(conferences?.[0] || 'ALL')
  
  // Build team lookup
  const teamMap = {}
  teams.forEach(t => teamMap[t.id] = t)

  // Attach teams to matchups
  const matchupsWithTeams = matchups.map(m => ({
    ...m,
    team_a: teamMap[m.team_a_id],
    team_b: teamMap[m.team_b_id],
    winner: teamMap[m.winner_team_id]
  }))

  // Group matchups by round and sort by bracket position
  const roundsWithMatchups = rounds.map(round => ({
    ...round,
    matchups: matchupsWithTeams
      .filter(m => m.round_id === round.id)
      .sort((a, b) => {
        // Sort by bracket_position if set, otherwise by seed
        const posA = a.bracket_position || a.team_a?.seed || 99
        const posB = b.bracket_position || b.team_a?.seed || 99
        return posA - posB
      })
  }))
  // Filter by conference (for display)
  const getConferenceMatchups = (round) => {
    if (activeConference === 'ALL' || round.round_order === rounds.length) {
      return round.matchups
    }
    return round.matchups.filter(m => 
      m.team_a?.conference === activeConference || 
      m.team_b?.conference === activeConference
    )
  }

  // Find bye teams (not in first round)
  const firstRoundTeamIds = new Set()
  const firstRound = roundsWithMatchups.find(r => r.round_order === 1)
  firstRound?.matchups.forEach(m => {
    if (m.team_a_id) firstRoundTeamIds.add(m.team_a_id)
    if (m.team_b_id) firstRoundTeamIds.add(m.team_b_id)
  })
  const byeTeams = teams.filter(t => 
    !firstRoundTeamIds.has(t.id) && 
    (activeConference === 'ALL' || t.conference === activeConference)
  )

  // Conference colors (table-driven)
  const conferenceColors = {
    'AFC': { bg: '#d32f2f', light: '#ffebee' },
    'NFC': { bg: '#1565c0', light: '#e3f2fd' },
    'East': { bg: '#1565c0', light: '#e3f2fd' },
    'West': { bg: '#d32f2f', light: '#ffebee' },
    'South': { bg: '#2e7d32', light: '#e8f5e9' },
    'Midwest': { bg: '#f57c00', light: '#fff3e0' },
    'default': { bg: '#666', light: '#f5f5f5' }
  }

  const getColor = (conf) => conferenceColors[conf] || conferenceColors.default

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: '#0070f3' }}>← Home</Link>
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>{event.name}</h1>
      
      {/* Conference Tabs */}
      {conferences.length > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 8, 
          marginBottom: 24,
          flexWrap: 'wrap'
        }}>
          {conferences.map(conf => (
            <button
              key={conf}
              onClick={() => setActiveConference(conf)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
                background: activeConference === conf ? getColor(conf).bg : '#eee',
                color: activeConference === conf ? 'white' : '#333',
                transition: 'all 0.2s'
              }}
            >
              {conf}
            </button>
          ))}
        </div>
      )}

      {/* Bracket Container - Horizontal Scroll on Mobile */}
      <div style={{ 
        overflowX: 'auto',
        paddingBottom: 20
      }}>
        <div style={{ 
          display: 'flex',
          gap: 0,
          minWidth: 'max-content',
          padding: '0 20px'
        }}>
          {/* Bye Teams Column (if any) */}
          {byeTeams.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              marginRight: 20
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px 16px',
                fontWeight: 'bold',
                fontSize: 14,
                color: '#666',
                textTransform: 'uppercase',
                minWidth: 180
              }}>
                Bye
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
                gap: 20
              }}>
                {byeTeams.map(team => (
                  <div key={team.id} style={{
                    background: getColor(team.conference).light,
                    padding: 12,
                    borderRadius: 8,
                    fontWeight: 'bold',
                    border: `2px solid ${getColor(team.conference).bg}`,
                    minWidth: 160
                  }}>
                    #{team.seed} {team.name} 👑
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round Columns */}
          {roundsWithMatchups.map((round, roundIndex) => {
            const conferenceMatchups = getConferenceMatchups(round)
            if (conferenceMatchups.length === 0) return null

            const isChampionship = round.round_order === rounds.length
            
            return (
              <div 
                key={round.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Round Header */}
                <div style={{ 
                  textAlign: 'center', 
                  padding: '12px 16px',
                  fontWeight: 'bold',
                  fontSize: 14,
                  color: isChampionship ? '#d4af37' : '#666',
                  textTransform: 'uppercase',
                  minWidth: 180
                }}>
                  {isChampionship && '🏆 '}{round.name}
                  <div style={{ fontSize: 11, fontWeight: 'normal' }}>
                    ({round.points} pts)
                  </div>
                </div>

                {/* Matchups */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-around',
                  flex: 1,
                  gap: Math.pow(2, roundIndex) * 20,
                  padding: `${Math.pow(2, roundIndex) * 10}px 0`
                }}>
                  {conferenceMatchups.map(matchup => (
                    <MatchupCard 
                      key={matchup.id} 
                      matchup={matchup}
                      isChampionship={isChampionship}
                      showConnector={roundIndex < roundsWithMatchups.length - 1}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 24, 
        marginTop: 24,
        fontSize: 14,
        color: '#666'
      }}>
        <span>✓ = Winner</span>
        <span style={{ color: '#28a745' }}>Green = Won</span>
      </div>
    </div>
  )
}

function MatchupCard({ matchup, isChampionship, showConnector }) {
  const teamA = matchup.team_a
  const teamB = matchup.team_b
  const winner = matchup.winner
  const isByeGame = !teamB

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        border: isChampionship ? '3px solid #d4af37' : '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden',
        minWidth: 180,
        boxShadow: isChampionship 
          ? '0 4px 12px rgba(212, 175, 55, 0.3)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        background: 'white',
        opacity: isByeGame ? 0.8 : 1
      }}>
        <TeamRow team={teamB} isWinner={winner?.id === teamB?.id} isBye={isByeGame} />
        <TeamRow team={teamA} isWinner={winner?.id === teamA?.id} isBottom />
        
        {isChampionship && winner && (
          <div style={{
            padding: 10,
            background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 13
          }}>
            🏆 CHAMPION
          </div>
        )}
      </div>

      {showConnector && (
        <div style={{
          width: 30,
          height: 2,
          background: '#ddd'
        }} />
      )}
    </div>
  )
}

function TeamRow({ team, isWinner, isBottom = false, isBye = false }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: isBye ? '#f5f5f5' : (isWinner ? '#d4edda' : 'white'),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: isBottom ? 'none' : '1px solid #eee',
      minHeight: 38
    }}>
      <span style={{ 
        fontWeight: isWinner ? 'bold' : 'normal',
        fontSize: 14,
        color: isBye ? '#999' : (isWinner ? '#155724' : (team ? '#333' : '#999')),
        fontStyle: isBye ? 'italic' : 'normal'
      }}>
        {isBye ? 'BYE' : (team ? `#${team.seed} ${team.name}` : 'TBD')}
      </span>
      {isWinner && !isBye && <span style={{ color: '#28a745' }}>✓</span>}
    </div>
  )
}