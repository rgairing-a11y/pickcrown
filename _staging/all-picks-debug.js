// app/pool/[poolId]/picks/page.js
// DEBUG VERSION - All Picks page with console logging

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function AllPicksPage({ params }) {
  const { poolId } = await params

  // Get pool with event details
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select(`
      *,
      event:events(
        id, name, year, start_time, status, uses_reseeding, event_type
      )
    `)
    .eq('id', poolId)
    .single()

  console.log('=== DEBUG ALL PICKS ===')
  console.log('Pool ID:', poolId)
  console.log('Pool:', pool?.name)
  console.log('Event:', pool?.event?.name)
  console.log('Event ID:', pool?.event?.id)
  console.log('Uses Reseeding:', pool?.event?.uses_reseeding)
  console.log('Pool Error:', poolError)

  if (poolError || !pool) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <h1>Pool not found</h1>
        <p>Error: {poolError?.message || 'Unknown error'}</p>
        <p>Pool ID: {poolId}</p>
      </div>
    )
  }

  const usesReseeding = pool.event?.uses_reseeding === true
  const isLocked = new Date(pool.event.start_time) < new Date()

  console.log('Is Locked:', isLocked)
  console.log('Start Time:', pool.event.start_time)

  // Get entries
  const { data: entries, error: entriesError } = await supabase
    .from('pool_entries')
    .select('id, entry_name, email')
    .eq('pool_id', poolId)
    .order('entry_name')

  console.log('Entries:', entries?.length)
  console.log('Entries Error:', entriesError)

  if (!entries || entries.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
          ← Back to Standings
        </Link>
        <h1 style={{ marginTop: 16 }}>📊 {pool.event.name} — All Picks</h1>
        <p style={{ color: '#666' }}>No entries yet.</p>
        <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 12 }}>
          Debug: entries={JSON.stringify(entries)}, error={entriesError?.message}
        </pre>
      </div>
    )
  }

  // Get rounds
  const { data: rounds, error: roundsError } = await supabase
    .from('rounds')
    .select('*')
    .eq('event_id', pool.event.id)
    .order('round_order')

  console.log('Rounds:', rounds?.length, rounds?.map(r => r.name))
  console.log('Rounds Error:', roundsError)

  // Get teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', pool.event.id)
    .order('seed')

  console.log('Teams:', teams?.length)
  console.log('Teams Error:', teamsError)

  const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]))

  // Different data loading based on event type
  let picksData = {}
  let matchups = []
  let eliminations = {}
  let debugInfo = {
    usesReseeding,
    isLocked,
    entriesCount: entries?.length,
    roundsCount: rounds?.length,
    teamsCount: teams?.length,
    picksCount: 0
  }

  if (usesReseeding) {
    // NFL-style: Load advancement_picks
    const entryIds = entries.map(e => e.id)
    console.log('Entry IDs:', entryIds)
    
    const { data: advancementPicks, error: picksError } = await supabase
      .from('advancement_picks')
      .select('*')
      .in('pool_entry_id', entryIds)

    console.log('Advancement Picks:', advancementPicks?.length)
    console.log('Picks Error:', picksError)
    console.log('Sample Pick:', advancementPicks?.[0])

    debugInfo.picksCount = advancementPicks?.length || 0
    debugInfo.picksError = picksError?.message
    debugInfo.samplePick = advancementPicks?.[0]

    // Group picks by entry -> round -> teams
    advancementPicks?.forEach(pick => {
      if (!picksData[pick.pool_entry_id]) {
        picksData[pick.pool_entry_id] = {}
      }
      if (!picksData[pick.pool_entry_id][pick.round_id]) {
        picksData[pick.pool_entry_id][pick.round_id] = []
      }
      picksData[pick.pool_entry_id][pick.round_id].push(pick.team_id)
    })

    console.log('Picks Data keys:', Object.keys(picksData))
    debugInfo.picksDataKeys = Object.keys(picksData)

    // Load eliminations for correct/incorrect display
    const { data: elimData } = await supabase
      .from('team_eliminations')
      .select('*')
      .eq('event_id', pool.event.id)

    elimData?.forEach(e => {
      eliminations[e.team_id] = e.eliminated_in_round_id
    })

  } else {
    // Standard bracket: Load bracket_picks and matchups
    const { data: matchupsData, error: matchupsError } = await supabase
      .from('matchups')
      .select('*, round:rounds(name, round_order, points)')
      .eq('event_id', pool.event.id)
      .order('bracket_position')

    console.log('Matchups:', matchupsData?.length)
    console.log('Matchups Error:', matchupsError)

    matchups = matchupsData || []
    debugInfo.matchupsCount = matchups.length
    debugInfo.matchupsError = matchupsError?.message

    // Load bracket picks
    const entryIds = entries.map(e => e.id)
    
    const { data: bracketPicks, error: bracketPicksError } = await supabase
      .from('bracket_picks')
      .select('*')
      .in('pool_entry_id', entryIds)

    console.log('Bracket Picks:', bracketPicks?.length)
    console.log('Bracket Picks Error:', bracketPicksError)

    debugInfo.picksCount = bracketPicks?.length || 0
    debugInfo.bracketPicksError = bracketPicksError?.message

    // Group by entry
    bracketPicks?.forEach(pick => {
      if (!picksData[pick.pool_entry_id]) {
        picksData[pick.pool_entry_id] = {}
      }
      picksData[pick.pool_entry_id][pick.matchup_id] = pick.team_id
    })
  }

  // Check if locked - but show debug info regardless
  const showDebug = true // Set to false in production

  // DEBUG DISPLAY
  if (showDebug) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
          ← Back to Standings
        </Link>
        
        <h1 style={{ marginTop: 16 }}>
          {usesReseeding ? '🏈' : '📊'} {pool.event.name} — All Picks (DEBUG)
        </h1>

        {/* Debug Info */}
        <div style={{ 
          background: '#fef3c7', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24,
          fontFamily: 'monospace',
          fontSize: 13
        }}>
          <h3 style={{ margin: '0 0 12px' }}>🔍 Debug Info</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {!isLocked && (
          <div style={{
            padding: 16,
            background: '#fee2e2',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <strong>⚠️ Event not locked yet!</strong>
            <p>Lock time: {pool.event.start_time}</p>
            <p>Current time: {new Date().toISOString()}</p>
          </div>
        )}

        {/* Show entries */}
        <div style={{ marginBottom: 24 }}>
          <h3>Entries ({entries.length})</h3>
          <ul>
            {entries.map(e => (
              <li key={e.id}>
                {e.entry_name} - {e.id}
                {picksData[e.id] && (
                  <span style={{ color: '#16a34a', marginLeft: 8 }}>
                    ✓ Has picks data ({Object.keys(picksData[e.id]).length} rounds)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Show rounds */}
        {rounds && rounds.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3>Rounds ({rounds.length})</h3>
            <ul>
              {rounds.map(r => (
                <li key={r.id}>
                  {r.name} (order: {r.round_order}, pts: {r.points}) - {r.id}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show actual picks for NFL */}
        {usesReseeding && rounds && rounds.length > 0 && (
          <div>
            <h3>Picks by Round</h3>
            {rounds.map(round => (
              <div key={round.id} style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: '#f9fafb',
                borderRadius: 8 
              }}>
                <h4>{round.name} ({round.points} pts)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Entry</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Picks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const entryPicks = picksData[entry.id]?.[round.id] || []
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{entry.entry_name}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {entryPicks.length === 0 ? (
                              <span style={{ color: '#999' }}>No picks for this round</span>
                            ) : (
                              entryPicks.map(teamId => {
                                const team = teamMap[teamId]
                                return (
                                  <span key={teamId} style={{
                                    display: 'inline-block',
                                    margin: '2px 4px',
                                    padding: '4px 8px',
                                    background: '#dcfce7',
                                    borderRadius: 4,
                                    fontSize: 12
                                  }}>
                                    {team ? `#${team.seed} ${team.name}` : teamId}
                                  </span>
                                )
                              })
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Show matchups for standard bracket */}
        {!usesReseeding && matchups.length > 0 && (
          <div>
            <h3>Matchups ({matchups.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Matchup</th>
                  {entries.map(e => (
                    <th key={e.id} style={{ textAlign: 'center', padding: 8 }}>{e.entry_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchups.slice(0, 10).map(m => {
                  const teamA = teamMap[m.team_a_id]
                  const teamB = teamMap[m.team_b_id]
                  return (
                    <tr key={m.id}>
                      <td style={{ padding: 8 }}>
                        {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'}
                      </td>
                      {entries.map(e => {
                        const pick = picksData[e.id]?.[m.id]
                        const team = pick ? teamMap[pick] : null
                        return (
                          <td key={e.id} style={{ textAlign: 'center', padding: 8 }}>
                            {team?.name || '—'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {matchups.length > 10 && <p>... and {matchups.length - 10} more matchups</p>}
          </div>
        )}
      </div>
    )
  }

  // ... rest of normal rendering would go here
}
