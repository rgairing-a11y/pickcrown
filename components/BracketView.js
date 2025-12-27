'use client'

import { useState } from 'react'

export default function BracketView({ event, rounds, matchups, teams }) {
  const conferences = [...new Set(teams.map(t => t.conference).filter(Boolean))]
  const [activeConference, setActiveConference] = useState('ALL')

  const teamMap = {}
  teams.forEach(t => teamMap[t.id] = t)

  const matchupsWithTeams = matchups.map(m => ({
    ...m,
    team_a: teamMap[m.team_a_id],
    team_b: teamMap[m.team_b_id],
    winner: teamMap[m.winner_team_id]
  }))

  const roundsWithMatchups = rounds.map(round => ({
    ...round,
    matchups: matchupsWithTeams
      .filter(m => m.round_id === round.id)
      .sort((a, b) => {
        const posA = a.bracket_position || a.team_a?.seed || 99
        const posB = b.bracket_position || b.team_a?.seed || 99
        return posA - posB
      })
  }))

  const conferenceColors = {
    'AFC': { primary: 'var(--color-afc)', light: 'var(--color-afc-light)' },
    'NFC': { primary: 'var(--color-nfc)', light: 'var(--color-nfc-light)' },
    'East': { primary: 'var(--color-east)', light: 'var(--color-east-light)' },
    'West': { primary: 'var(--color-west)', light: 'var(--color-west-light)' },
    'South': { primary: 'var(--color-south)', light: 'var(--color-south-light)' },
    'Midwest': { primary: 'var(--color-midwest)', light: 'var(--color-midwest-light)' }
  }

  const getConferenceColor = (conf) => conferenceColors[conf] || { primary: 'var(--color-text-light)', light: 'var(--color-background-dark)' }

  const filteredRounds = roundsWithMatchups.map(round => {
    const isChampionship = round.round_order === rounds.length
    return {
      ...round,
      matchups: round.matchups.filter(m => {
        if (activeConference === 'ALL') return true
        if (isChampionship) return true
        const teamConf = m.team_a?.conference
        return teamConf === activeConference
      })
    }
  })

  return (
    <div>
      {/* Event Header */}
      <div style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-xl)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0 }}>{event.name}</h1>
        <p style={{ color: 'var(--color-text-light)', margin: 'var(--spacing-sm) 0 0' }}>
          {event.year}
        </p>
      </div>

      {/* Conference Tabs */}
      {conferences.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-xl)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveConference('ALL')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: activeConference === 'ALL' ? 'var(--color-text)' : 'var(--color-border-light)',
              color: activeConference === 'ALL' ? 'white' : 'var(--color-text)',
              transition: 'all 0.2s'
            }}
          >
            ALL
          </button>
          {conferences.map(conf => {
            const colors = getConferenceColor(conf)
            const isActive = activeConference === conf
            return (
              <button
                key={conf}
                onClick={() => setActiveConference(conf)}
                style={{
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: isActive ? colors.primary : colors.light,
                  color: isActive ? 'white' : colors.primary,
                  transition: 'all 0.2s'
                }}
              >
                {conf}
              </button>
            )
          })}
        </div>
      )}

      {/* Bracket Container */}
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        padding: 'var(--spacing-xl)',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xxl)',
          minWidth: 'fit-content',
          paddingBottom: 'var(--spacing-lg)'
        }}>
          {filteredRounds.map((round, roundIndex) => {
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
                  background: isChampionship ? 'var(--color-gold-light)' : 'var(--color-background)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: 'var(--font-size-sm)',
                  color: isChampionship ? 'var(--color-gold)' : 'var(--color-text-light)',
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
                  {round.matchups.map((matchup, matchupIndex) => (
                    <MatchupCard
                      key={matchup.id}
                      matchup={matchup}
                      isChampionship={isChampionship}
                      showConnector={roundIndex < rounds.length - 1}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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
        border: isChampionship ? '3px solid var(--color-gold)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minWidth: 180,
        boxShadow: isChampionship
          ? '0 4px 12px rgba(212, 175, 55, 0.3)'
          : 'var(--shadow-sm)',
        background: 'var(--color-white)',
        opacity: isByeGame ? 0.8 : 1
      }}>
        <TeamRow team={teamB} isWinner={winner?.id === teamB?.id} isBye={isByeGame} />
        <TeamRow team={teamA} isWinner={winner?.id === teamA?.id} isBottom />

        {isChampionship && winner && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, var(--color-gold), #f4d03f)',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-sm)'
          }}>
            🏆 CHAMPION
          </div>
        )}
      </div>

      {showConnector && (
        <div style={{
          width: 30,
          height: 2,
          background: 'var(--color-border)'
        }} />
      )}
    </div>
  )
}

function TeamRow({ team, isWinner, isBottom = false, isBye = false }) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      background: isBye ? 'var(--color-background-dark)' : (isWinner ? 'var(--color-success-light)' : 'var(--color-white)'),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: isBottom ? 'none' : '1px solid var(--color-border-light)',
      minHeight: 38
    }}>
      <span style={{
        fontWeight: isWinner ? 'bold' : 'normal',
        fontSize: 'var(--font-size-md)',
        color: isBye ? 'var(--color-text-muted)' : (isWinner ? 'var(--color-success-dark)' : (team ? 'var(--color-text)' : 'var(--color-text-muted)')),
        fontStyle: isBye ? 'italic' : 'normal'
      }}>
        {isBye ? 'BYE' : (team ? `#${team.seed} ${team.name}` : 'TBD')}
      </span>
      {isWinner && !isBye && <span style={{ color: 'var(--color-success)' }}>✓</span>}
    </div>
  )
}