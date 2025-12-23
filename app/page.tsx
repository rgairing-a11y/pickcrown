export const dynamic = 'force-dynamic'

import { supabase } from '../lib/supabase'

export default async function Home() {
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

  const normalizedRounds = rounds?.map(round => ({
  ...round,
  matchups: normalizedRounds.matchups.map(m => ({
    ...m,
    teamA: m.team_a?.[0] ?? null,
    teamB: m.team_b?.[0] ?? null,
    winner: m.winner?.[0] ?? null,
  }))
}))


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

    {normalizedRounds?.map(round => (
      <div key={round.id} style={{ marginBottom: 24 }}>
        <h2>{round.name}</h2>

        {round.matchups.map(matchup => (
          <div key={matchup.id} style={{ marginLeft: 16, marginBottom: 8 }}>
            <div>
              {matchup.teamA?.name ?? '—'} vs {matchup.teamB?.name ?? '—'}
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

