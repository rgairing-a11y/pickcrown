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
  const { eventId, roundId, teamAId, teamBId } = body

  if (!eventId || !roundId || !teamAId || !teamBId) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('matchups')
    .insert({
      event_id: eventId,
      round_id: roundId,
      team_a_id: teamAId,
      team_b_id: teamBId
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

  const { data, error } = await supabase
    .from('matchups')
    .update({ winner_team_id: winnerTeamId || null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
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