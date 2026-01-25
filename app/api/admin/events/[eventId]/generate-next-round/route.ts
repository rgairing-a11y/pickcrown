import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'

/**
 * CONCERN B - RESULT-TIME MATCHUP GENERATION (SERVER / ADMIN)
 *
 * Generate next round matchups after a round completes.
 * Works for any round transition in NFL bracket events.
 *
 * For Divisional (after Wildcard): Uses reseeding
 * For Conference Championship (after Divisional): Standard advancement
 * For Super Bowl (after Conference): Standard advancement
 *
 * Query params:
 *   sourceRoundOrder: The round that just completed (e.g., 1 for Wildcard)
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { eventId } = await params

  const url = new URL(request.url)
  const sourceRoundOrder = parseInt(url.searchParams.get('sourceRoundOrder') || '1')

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

    const sourceRound = rounds.find(r => r.round_order === sourceRoundOrder)
    const targetRound = rounds.find(r => r.round_order === sourceRoundOrder + 1)

    if (!sourceRound) {
      return NextResponse.json(
        { success: false, error: `Source round ${sourceRoundOrder} not found` },
        { status: 400 }
      )
    }

    if (!targetRound) {
      return NextResponse.json(
        { success: false, error: 'No next round exists - this may be the final' },
        { status: 400 }
      )
    }

    // 3. Load teams
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

    // 4. Load source round matchups
    const { data: sourceMatchups, error: srcError } = await supabase
      .from('matchups')
      .select('*')
      .eq('round_id', sourceRound.id)
      .order('bracket_position')

    if (srcError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load source round matchups' },
        { status: 500 }
      )
    }

    // 5. Check all source games are complete
    const incompleteGames = sourceMatchups?.filter(m => {
      if (m.team_a_id && !m.team_b_id) return false
      if (!m.team_a_id && m.team_b_id) return false
      return !m.winner_team_id
    }) || []

    if (incompleteGames.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Not all ${sourceRound.name} games are complete`,
        incomplete_count: incompleteGames.length
      }, { status: 400 })
    }

    // 6. Collect advancing teams
    const advancingTeams: typeof teams = []

    // For Wildcard -> Divisional, add bye teams
    if (sourceRoundOrder === 1) {
      teams.forEach(team => {
        if (team.has_bye) {
          advancingTeams.push(team)
        }
      })
    }

    // Add winners from source round
    sourceMatchups?.forEach(matchup => {
      if (matchup.winner_team_id) {
        const team = teamMap[matchup.winner_team_id]
        if (team) {
          advancingTeams.push(team)
        }
      }
    })

    // 7. Determine if reseeding applies
    const useReseeding = sourceRoundOrder === 1 // Only reseed after Wildcard

    // 8. Generate matchups based on strategy
    let generatedMatchups: Array<{ conference: string, position: number, team_a: typeof teams[0], team_b: typeof teams[0] }> = []

    if (useReseeding) {
      // NFL Reseeding: highest vs lowest seed per conference
      const generateConferenceMatchups = (conference: string) => {
        const confTeams = advancingTeams
          .filter(t => t.conference === conference)
          .sort((a, b) => a.seed - b.seed)

        const matchups: typeof generatedMatchups = []
        let position = 1

        while (confTeams.length >= 2) {
          const highest = confTeams.shift()!
          const lowest = confTeams.pop()!

          matchups.push({
            conference,
            position,
            team_a: highest,
            team_b: lowest
          })
          position++
        }

        return matchups
      }

      generatedMatchups = [
        ...generateConferenceMatchups('AFC'),
        ...generateConferenceMatchups('NFC')
      ]
    } else {
      // Standard bracket advancement
      // Winners from positions 1,2 go to position 1 in next round (conference matchup)
      // For Super Bowl: AFC champ vs NFC champ
      const afcTeams = advancingTeams.filter(t => t.conference === 'AFC')
      const nfcTeams = advancingTeams.filter(t => t.conference === 'NFC')

      if (targetRound.round_order === 4) {
        // Super Bowl: AFC vs NFC
        if (afcTeams.length === 1 && nfcTeams.length === 1) {
          generatedMatchups.push({
            conference: 'SUPER',
            position: 1,
            team_a: afcTeams[0],
            team_b: nfcTeams[0]
          })
        }
      } else {
        // Conference Championship: within conference
        if (afcTeams.length === 2) {
          // Sort by seed and pair
          afcTeams.sort((a, b) => a.seed - b.seed)
          generatedMatchups.push({
            conference: 'AFC',
            position: 1,
            team_a: afcTeams[0],
            team_b: afcTeams[1]
          })
        }
        if (nfcTeams.length === 2) {
          nfcTeams.sort((a, b) => a.seed - b.seed)
          generatedMatchups.push({
            conference: 'NFC',
            position: 1,
            team_a: nfcTeams[0],
            team_b: nfcTeams[1]
          })
        }
      }
    }

    // 9. Load existing target round matchups
    const { data: targetMatchups, error: tgtError } = await supabase
      .from('matchups')
      .select('*')
      .eq('round_id', targetRound.id)
      .order('bracket_position')

    if (tgtError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load target round matchups' },
        { status: 500 }
      )
    }

    // 10. Update target matchups with generated teams
    const updates: Array<{ id: string, team_a_id: string, team_b_id: string }> = []

    targetMatchups?.forEach(matchup => {
      let projectedMatchup

      if (useReseeding) {
        // Divisional: positions 1-2 = AFC, 3-4 = NFC
        if (matchup.bracket_position <= 2) {
          const positionInConf = matchup.bracket_position
          projectedMatchup = generatedMatchups.find(
            m => m.conference === 'AFC' && m.position === positionInConf
          )
        } else {
          const positionInConf = matchup.bracket_position - 2
          projectedMatchup = generatedMatchups.find(
            m => m.conference === 'NFC' && m.position === positionInConf
          )
        }
      } else if (targetRound.round_order === 4) {
        // Super Bowl
        projectedMatchup = generatedMatchups.find(m => m.conference === 'SUPER')
      } else {
        // Conference Championship: position 1 = AFC, position 2 = NFC
        const conference = matchup.bracket_position === 1 ? 'AFC' : 'NFC'
        projectedMatchup = generatedMatchups.find(m => m.conference === conference)
      }

      if (projectedMatchup) {
        updates.push({
          id: matchup.id,
          team_a_id: projectedMatchup.team_a.id,
          team_b_id: projectedMatchup.team_b.id
        })
      }
    })

    // 11. Perform updates
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

    // 12. Audit log
    await logAudit({
      action: 'generate_next_round_matchups',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: true,
        source_round: sourceRound.name,
        target_round: targetRound.name,
        used_reseeding: useReseeding,
        advancing_teams: advancingTeams.map(t => ({
          id: t.id,
          name: t.name,
          seed: t.seed,
          conference: t.conference
        })),
        generated_matchups: generatedMatchups.map(m => ({
          conference: m.conference,
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        })),
        matchups_updated: updatedCount
      }
    })

    return NextResponse.json({
      success: true,
      message: `${targetRound.name} matchups generated successfully`,
      data: {
        source_round: sourceRound.name,
        target_round: targetRound.name,
        used_reseeding: useReseeding,
        advancing_teams_count: advancingTeams.length,
        matchups_updated: updatedCount,
        matchups: generatedMatchups.map(m => ({
          conference: m.conference,
          team_a: `#${m.team_a.seed} ${m.team_a.name}`,
          team_b: `#${m.team_b.seed} ${m.team_b.name}`
        }))
      }
    })

  } catch (error) {
    console.error('Error generating next round matchups:', error)

    await logAudit({
      action: 'generate_next_round_matchups',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: false,
        source_round_order: sourceRoundOrder,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
