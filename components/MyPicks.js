'use client'

import { useState, useEffect } from 'react'

export default function MyPicksButton({ 
  poolEntries, 
  bracketPicks, 
  matchups,
  roundNames 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [myEntry, setMyEntry] = useState(null)
  const [searched, setSearched] = useState(false)

  // Auto-load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Auto-search when modal opens with saved email
  useEffect(() => {
    if (isOpen && email && poolEntries) {
      const entry = poolEntries?.find(e => 
        e.email?.toLowerCase() === email.toLowerCase().trim()
      )
      if (entry) {
        setMyEntry(entry)
        setSearched(true)
      }
    }
  }, [isOpen, email, poolEntries])

  function handleSearch() {
    if (email) {
      localStorage.setItem('pickcrown_email', email.toLowerCase().trim())
      const entry = poolEntries?.find(e => 
        e.email?.toLowerCase() === email.toLowerCase().trim()
      )
      setMyEntry(entry || null)
      setSearched(true)
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  function handleClose() {
    setIsOpen(false)
  }

  // Get my picks
  const myPicks = myEntry 
    ? bracketPicks?.filter(p => p.pool_entry_id === myEntry.id) || []
    : []

  // Group picks by matchup
  const picksByMatchup = {}
  myPicks.forEach(pick => {
    picksByMatchup[pick.matchup_id] = pick
  })

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          background: '#10b981',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        🎯 My Picks
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
          padding: 24
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>🎯 My Picks</h2>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Email Input */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              marginBottom: 20
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                Find
              </button>
            </div>

            {/* Results */}
            {searched && !myEntry && email && (
              <div style={{
                padding: 16,
                background: '#fef2f2',
                borderRadius: 8,
                color: '#dc2626'
              }}>
                No entry found for "{email}" in this pool.
              </div>
            )}

            {myEntry && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 16,
                  padding: 12,
                  background: '#f0fdf4',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#166534' }}>
                      {myEntry.entry_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {myEntry.email}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#dcfce7', 
                    padding: '6px 12px', 
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#166534'
                  }}>
                    {myPicks.length} picks
                  </div>
                </div>

                {/* Picks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                          padding: '8px 12px',
                          background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#f9fafb',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 6 }}>
                            {roundNames?.[matchup.round_id] || 'Round'}:
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            {pickedTeam?.seed && `#${pickedTeam.seed} `}
                            {pickedTeam?.name || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13 }}>
                          {isCorrect && <span style={{ color: '#16a34a' }}>✓</span>}
                          {isWrong && <span style={{ color: '#dc2626' }}>✗</span>}
                          {isPending && <span style={{ color: '#9ca3af' }}>—</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
