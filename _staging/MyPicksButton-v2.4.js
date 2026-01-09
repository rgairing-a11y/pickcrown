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
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-3) var(--spacing-5)',
          background: 'var(--color-success)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          textDecoration: 'none',
          fontWeight: 'var(--font-semibold)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-size-base)',
          transition: 'all var(--transition-fast)'
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
          zIndex: 'var(--z-modal)',
          padding: 'var(--spacing-6)'
        }}>
          <div style={{
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-6)',
            maxWidth: 500,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-5)'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-semibold)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}>
                🎯 My Picks
              </h2>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2xl)',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 'var(--spacing-1)',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            
            {/* Email Input */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-3)', 
              marginBottom: 'var(--spacing-5)'
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  background: 'var(--color-white)'
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-5)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-semibold)',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Find
              </button>
            </div>

            {/* Results */}
            {searched && !myEntry && email && (
              <div style={{
                padding: 'var(--spacing-4)',
                background: 'var(--color-danger-light)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-danger)'
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
                  marginBottom: 'var(--spacing-4)',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  background: 'var(--color-success-light)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div>
                    <div style={{ 
                      fontWeight: 'var(--font-semibold)', 
                      fontSize: 'var(--font-size-lg)', 
                      color: 'var(--color-success-dark)' 
                    }}>
                      {myEntry.entry_name}
                    </div>
                    <div style={{ 
                      fontSize: 'var(--font-size-xs)', 
                      color: 'var(--color-text-muted)' 
                    }}>
                      {myEntry.email}
                    </div>
                  </div>
                  <div style={{ 
                    background: 'var(--color-success)', 
                    padding: 'var(--spacing-2) var(--spacing-3)', 
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'white'
                  }}>
                    {myPicks.length} picks
                  </div>
                </div>

                {/* Picks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {matchups?.filter(m => picksByMatchup[m.id]).map(matchup => {
                    const pick = picksByMatchup[matchup.id]
                    // Use picked_team from the pick data (works even when matchup teams are null)
                    const pickedTeam = pick.picked_team || 
                      (matchup.team_a?.id === pick.picked_team_id ? matchup.team_a : matchup.team_b)
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
                          padding: 'var(--spacing-3) var(--spacing-4)',
                          background: isCorrect 
                            ? 'var(--color-success-light)' 
                            : isWrong 
                              ? 'var(--color-danger-light)' 
                              : 'var(--color-background)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      >
                        <div>
                          <span style={{ 
                            fontSize: 'var(--font-size-xs)', 
                            color: 'var(--color-text-muted)', 
                            marginRight: 'var(--spacing-2)' 
                          }}>
                            {roundNames?.[matchup.round_id] || 'Round'}:
                          </span>
                          <span style={{ fontWeight: 'var(--font-medium)' }}>
                            {pickedTeam?.seed && `#${pickedTeam.seed} `}
                            {pickedTeam?.name || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          {isCorrect && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                          {isWrong && <span style={{ color: 'var(--color-danger)' }}>✗</span>}
                          {isPending && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
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
