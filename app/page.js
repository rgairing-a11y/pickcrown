'use client'

export const dynamic = 'force-dynamic'

import { supabase } from '../lib/supabase'

import { useState } from 'react'


export default async function Home() {
 const [selectedMatchupId, setSelectedMatchupId] = useState(null)
 
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select(`
      id,
      name,
      round_order,
      matchups (
        id,
        team_a:team_a_id (
          id,
          name
        ),
        team_b:team_b_id (
          id,
          name
        ),
        winner:winner_team_id (
          id,
          name
        )
      )
    `)
    .order('round_order', { ascending: true })

  if (error) {
    return (
      <pre style={{ padding: 24 }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>PickCrown — NFL Playoffs</h1>

      {rounds?.map(round => (
        <div key={round.id} style={{ marginBottom: 24 }}>
          <h2>{round.name}</h2>

          {round.matchups?.map(matchup => (
            <div
              key={matchup.id}
              style={{ marginLeft: 16, marginBottom: 8 }}
            >
             <div
  onClick={() => setSelectedMatchupId(matchup.id)}
  style={{
    cursor: 'pointer',
    padding: 8,
    border:
      selectedMatchupId === matchup.id
        ? '2px solid orange'
        : '1px solid #ccc'
  }}
>
  {matchup.team_a?.name ?? '—'} vs{' '}
  {matchup.team_b?.name ?? '—'}
</div>


              {matchup.winner && (
                <div style={{ fontWeight: 'bold' }}>
                  Winner: {matchup.winner.name}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
