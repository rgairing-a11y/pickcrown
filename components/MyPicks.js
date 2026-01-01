'use client'

import { useState, useEffect } from 'react'

export default function MyPicks({ 
  poolEntries, 
  bracketPicks, 
  matchups,
  roundNames 
}) {
  const [email, setEmail] = useState('')
  const [showPicks, setShowPicks] = useState(false)
  const [myEntry, setMyEntry] = useState(null)

  // Load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Find entry when email changes
  useEffect(() => {
    if (email) {
      const entry = poolEntries?.find(e => 
        e.email?.toLowerCase() === email.toLowerCase()
      )
      setMyEntry(entry || null)
    } else {
      setMyEntry(null)
    }
  }, [email, poolEntries])

  function handleLookup() {
    if (email) {
      localStorage.setItem('pickcrown_email', email)
      setShowPicks(true)
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  // Get my picks
  const myPicks = myEntry 
    ? bracketPicks?.filter(p => p.pool_entry_id === myEntry.id) || []
    : []

  // Group picks by round
  const picksByMatchup = {}
  myPicks.forEach(pick => {
    picksByMatchup[pick.matchup_id] = pick
  })

  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: '20px', marginBottom: 16 }}>🎯 My Picks</h2>
      
      {/* Email Input */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your email"
          style={{
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            width: 250
          }}
        />
        <button
          onClick={handleLookup}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Show My Picks
        </button>
      </div>

      {/* Results */}
      {showPicks && !myEntry && email && (
        <div style={{
          padding: 16,
          background: '#fef2f2',
          borderRadius: 8,
          color: '#dc2626'
        }}>
          No entry found for "{email}" in this pool.
        </div>
      )}

      {showPicks && myEntry && (
        <div style={{
          padding: 20,
          background: '#f0fdf4',
          borderRadius: 12,
          border: '2px solid #22c55e'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18, color: '#166534' }}>
                {myEntry.entry_name}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {myEntry.email}
              </div>
            </div>
            <div style={{ 
              background: '#dcfce7', 
              padding: '8px 16px', 
              borderRadius: 8,
              fontWeight: 600,
              color: '#166534'
            }}>
              {myPicks.length} picks
            </div>
          </div>

          {/* Picks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matchups?.filter(m => picksByMatchup[m.id]).map(matchup => {
              const pick = picksByMatchup[matchup.id]
              const pickedTeam = matchup.team_a?.id === pick.picked_team_id 
                ? matchup.team_a 
                : matchup.team_b
              const isCorrect = matchup.winner_team_id === pick.picked_team_id
              const isWrong = matchup.winner_team_id && matchup.winner_team_id !== pick.picked_team_id
              const isPending = !matchup.winner_team_id

              return (
                <div 
                  key={matchup.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : 'white',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginRight: 8 }}>
                      {roundNames?.[matchup.round_id] || 'Round'}:
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {pickedTeam?.seed && `#${pickedTeam.seed} `}
                      {pickedTeam?.name || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    {isCorrect && <span style={{ color: '#16a34a' }}>✓ Correct</span>}
                    {isWrong && <span style={{ color: '#dc2626' }}>✗ Wrong</span>}
                    {isPending && <span style={{ color: '#9ca3af' }}>Pending</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
