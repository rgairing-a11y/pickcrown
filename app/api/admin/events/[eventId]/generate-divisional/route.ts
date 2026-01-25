import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'

/**
 * CONCERN B - RESULT-TIME MATCHUP GENERATION (SERVER / ADMIN)
 *
 * This endpoint generates Divisional round matchups after Wildcard completes.
 *
 * Rules:
 * 1. Read actual winners from matchups.winner_team_id (Wildcard round)
 * 2. Add bye teams (has_bye = true)
 * 3. Sort all advancing teams by seed
 * 4. Apply reseeding: highest vs lowest, next vs next
 * 5. UPDATE existing Divisional matchup rows with team_a_id and team_b_id
 *
 * This endpoint is IDEMPOTENT - safe to re-run.
 * It will NOT create new matchups, only populate existing empty ones.
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { eventId } = await params

  try {
    // 1. Load event and verify it's an nfl_bracket type
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_type')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.event_type !== 'nfl_bracket') {
      await logAudit({
        action: 'generate_divisional_matchups',
        target_type: 'event',
        target_id: eventId,
        metadata: {
          success: false,
          error: 'Event is not nfl_bracket type',
          event_type: event.event_type
        }
      })

      return NextResponse.json(
        { success: false, error: 'This endpoint only works for nfl_bracket events' },
        { status: 400 }
      )
    }

    // 2. Load all rounds
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')

    if (roundsError || !rounds?.length) {
      return NextResponse.json(
        { success: false, error: 'No rounds found for event' },
        { status: 400 }
      )
    }

    const wildcardRound = rounds.find(r => r.round_order === 1)
    const divisionalRound = rounds.find(r => r.round_order === 2)

    if (!wildcardRound || !divisionalRound) {
      return NextResponse.json(
        { success: false, error: 'Missing Wildcard or Divisional round' },
        { status: 400 }
      )
    }

    // 3. Load teams (for bye teams and seed info)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)

    if (teamsError || !teams?.length) {
      return NextResponse.json(
        { success: false, error: 'No teams found for event' },
        { status: 400 }
      )
    }

    const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

    // 4. Load Wildcard matchups with winners
    const { data: wildcardMatchups, error: wcError } = await supabase
      .from('matchups')
      .select('*')
      .eq('round_id', wildcardRound.id)
      .order('bracket_position')

    if (wcError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load Wildcard matchups' },
        { status: 500 }
      )
    }

    // 5. Check all Wildcard games are complete
    const incompleteGames = wildcardMatchups?.filter(m => {
      // Skip bye games
      if (m.team_a_id && !m.team_b_id) return false
      if (!m.team_a_id && m.team_b_id) return false
      // Real matchup needs winner
      return !m.winner_team_id
    }) || []

    if (incompleteGames.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Not all Wildcard games are complete',
        incomplete_count: incompleteGames.length
      }, { status: 400 })
    }

    // 6. Collect advancing teams
    const advancingTeams: typeof teams = []

    // Add bye teams
    teams.forEach(team => {
      if (team.has_bye) {
        advancingTeams.push(team)
      }
    })

    // Add Wildcard winners
    wildcardMatchups?.forEach(matchup => {
      if (matchup.winner_team_id) {
        const team = teamMap[matchup.winner_team_id]
        if (team) {
          advancingTeams.push(team)
        }
      }
    })

    // 7. Apply reseeding for each conference
    const generateConferenceMatchups = (conference: string) => {
      const confTeams = advancingTeams
        .filter(t => t.conference === conference)
        .sort((a, b) => a.seed - b.seed) // Lower seed number = higher seed

      const matchups: Array<{ team_a: typeof teams[0], team_b: typeof teams[0], position: number }> = []
      let position = 1

      while (confTeams.length >= 2) {
        const highest = confTeams.shift()! // Best seed (lowest number)
        const lowest = confTeams.pop()!    // Worst seed (highest number)

        matchups.push({
          team_a: highest,
          team_b: lowest,
          position: position
        })
        position++
      }

      return matchups
    }

    const afcMatchups = generateConferenceMatchups('AFC')
    const nfcMatchups = generateConferenceMatchups('NFC')

    // 8. Load existing Divisional matchups
    const { data: divisionalMatchups, error: divError } = await supabase
      .from('matchups')
      .select('*')
      .eq('round_id', divisionalRound.id)
      .order('bracket_position')

    if (divError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load Divisional matchups' },
        { status: 500 }
      )
    }

    // 9. Update Divisional matchups with reseeded teams
    // Convention: bracket_position 1-2 = AFC, 3-4 = NFC
    const updates: Array<{ id: string, team_a_id: string, team_b_id: string }> = []

    divisionalMatchups?.forEach(matchup => {
      let projectedMatchup

      // Determine which projected matchup maps to this position
      if (matchup.bracket_position <= 2) {
        // AFC
        const positionInConf = matchup.bracket_position
        projectedMatchup = afcMatchups.find(m => m.position === positionInConf)
      } else {
        // NFC (positions 3-4 map to conference positions 1-2)
        const positionInConf = matchup.bracket_position - 2
        projectedMatchup = nfcMatchups.find(m => m.position === positionInConf)
      }

      if (projectedMatchup) {
        updates.push({
          id: matchup.id,
          team_a_id: projectedMatchup.team_a.id,
          team_b_id: projectedMatchup.team_b.id
        })
      }
    })

    // 10. Perform updates
    let updatedCount = 0
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('matchups')
        .update({
          team_a_id: update.team_a_id,
          team_b_id: update.team_b_id
        })
        .eq('id', update.id)

      if (!updateError) {
        updatedCount++
      }
    }

    // 11. Audit log
    await logAudit({
      action: 'generate_divisional_matchups',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: true,
        advancing_teams: advancingTeams.map(t => ({ id: t.id, name: t.name, seed: t.seed, conference: t.conference })),
        afc_matchups: afcMatchups.map(m => ({
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        })),
        nfc_matchups: nfcMatchups.map(m => ({
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        })),
        matchups_updated: updatedCount
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Divisional matchups generated successfully',
      data: {
        advancing_teams_count: advancingTeams.length,
        matchups_updated: updatedCount,
        afc_matchups: afcMatchups.map(m => ({
          position: m.position,
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        })),
        nfc_matchups: nfcMatchups.map(m => ({
          position: m.position,
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        }))
      }
    })

  } catch (error) {
    console.error('Error generating divisional matchups:', error)

    await logAudit({
      action: 'generate_divisional_matchups',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
