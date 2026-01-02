import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('matchups')
    .select(`
      *,
      round:rounds(*),
      team_a:teams!matchups_team_a_id_fkey(*),
      team_b:teams!matchups_team_b_id_fkey(*),
      winner:teams!matchups_winner_team_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { eventId, roundId, teamAId, teamBId, bracketPosition } = body

  if (!eventId || !roundId) {
    return NextResponse.json({ error: 'Event ID and Round ID required' }, { status: 400 })
  }

  // Get existing matchups in this round to auto-assign bracket position
  const { data: existingMatchups } = await supabase
    .from('matchups')
    .select('bracket_position')
    .eq('round_id', roundId)
    .order('bracket_position', { ascending: false })
    .limit(1)

  const nextPosition = bracketPosition || 
    (existingMatchups?.[0]?.bracket_position ? existingMatchups[0].bracket_position + 1 : 1)

  const { data, error } = await supabase
    .from('matchups')
    .insert({
      event_id: eventId,
      round_id: roundId,
      team_a_id: teamAId || null,
      team_b_id: teamBId || null,
      bracket_position: nextPosition
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request) {
  const body = await request.json()
  const { id, winnerTeamId } = body

  if (!id) {
    return NextResponse.json({ error: 'Matchup ID required' }, { status: 400 })
  }

  // Get the matchup with its round info
  const { data: matchup, error: matchupError } = await supabase
    .from('matchups')
    .select(`
      *,
      round:rounds(*)
    `)
    .eq('id', id)
    .single()

  if (matchupError) {
    return NextResponse.json({ error: matchupError.message }, { status: 500 })
  }

  // Update the winner
  const { data, error } = await supabase
    .from('matchups')
    .update({ winner_team_id: winnerTeamId || null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // BRACKET ADVANCEMENT: Advance winner to next round
  if (winnerTeamId && matchup.round?.round_order) {
    await advanceWinnerToNextRound(
      matchup.event_id,
      matchup.round.round_order,
      matchup.bracket_position,
      winnerTeamId
    )
  }

  // If clearing winner, also clear from next round
  if (!winnerTeamId && matchup.round?.round_order) {
    await clearFromNextRound(
      matchup.event_id,
      matchup.round.round_order,
      matchup.bracket_position
    )
  }

  return NextResponse.json(data)
}

// Advance winner to the next round's matchup
async function advanceWinnerToNextRound(eventId, currentRoundOrder, bracketPosition, winnerTeamId) {
  // Get the next round
  const { data: nextRound } = await supabase
    .from('rounds')
    .select('id')
    .eq('event_id', eventId)
    .eq('round_order', currentRoundOrder + 1)
    .single()

  if (!nextRound) {
    // No next round - this is the final, nothing to advance
    return
  }

  // Calculate which matchup in the next round this feeds into
  // Positions 1,2 feed into next round position 1
  // Positions 3,4 feed into next round position 2, etc.
  const nextBracketPosition = Math.ceil(bracketPosition / 2)
  
  // Odd positions go to team_a, even positions go to team_b
  const isTeamA = bracketPosition % 2 === 1

  // Find or create the next round matchup
  let { data: nextMatchup } = await supabase
    .from('matchups')
    .select('*')
    .eq('round_id', nextRound.id)
    .eq('bracket_position', nextBracketPosition)
    .single()

  if (!nextMatchup) {
    // Create the next round matchup
    const { data: created } = await supabase
      .from('matchups')
      .insert({
        event_id: eventId,
        round_id: nextRound.id,
        bracket_position: nextBracketPosition,
        team_a_id: isTeamA ? winnerTeamId : null,
        team_b_id: isTeamA ? null : winnerTeamId
      })
      .select()
      .single()
    nextMatchup = created
  } else {
    // Update existing matchup with the advancing team
    const updateData = isTeamA 
      ? { team_a_id: winnerTeamId }
      : { team_b_id: winnerTeamId }
    
    await supabase
      .from('matchups')
      .update(updateData)
      .eq('id', nextMatchup.id)
  }
}

// Clear team from next round when winner is unset
async function clearFromNextRound(eventId, currentRoundOrder, bracketPosition) {
  // Get the next round
  const { data: nextRound } = await supabase
    .from('rounds')
    .select('id')
    .eq('event_id', eventId)
    .eq('round_order', currentRoundOrder + 1)
    .single()

  if (!nextRound) return

  const nextBracketPosition = Math.ceil(bracketPosition / 2)
  const isTeamA = bracketPosition % 2 === 1

  // Find the next round matchup
  const { data: nextMatchup } = await supabase
    .from('matchups')
    .select('*')
    .eq('round_id', nextRound.id)
    .eq('bracket_position', nextBracketPosition)
    .single()

  if (nextMatchup) {
    // Clear the appropriate team slot
    const updateData = isTeamA 
      ? { team_a_id: null }
      : { team_b_id: null }
    
    // Also clear the winner if it was this team
    await supabase
      .from('matchups')
      .update({
        ...updateData,
        winner_team_id: null // Clear downstream results
      })
      .eq('id', nextMatchup.id)

    // Recursively clear from subsequent rounds
    if (nextMatchup.winner_team_id) {
      await clearFromNextRound(eventId, currentRoundOrder + 1, nextBracketPosition)
    }
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Matchup ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('matchups')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
