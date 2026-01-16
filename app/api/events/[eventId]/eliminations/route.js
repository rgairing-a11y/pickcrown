import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch all eliminations for an event
export async function GET(request, { params }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { eventId } = await params

    const { data, error } = await supabaseAdmin
      .from('team_eliminations')
      .select('*')
      .eq('event_id', eventId)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Set elimination for a team
export async function POST(request, { params }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { eventId } = await params
    const { team_id, eliminated_in_round_id } = await request.json()

    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 })
    }

    if (eliminated_in_round_id) {
      // Upsert elimination record
      const { data, error } = await supabaseAdmin
        .from('team_eliminations')
        .upsert({
          event_id: eventId,
          team_id: team_id,
          eliminated_in_round_id: eliminated_in_round_id
        }, {
          onConflict: 'event_id,team_id'
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, elimination: data })
    } else {
      // Clear elimination (team still alive)
      const { error } = await supabaseAdmin
        .from('team_eliminations')
        .delete()
        .eq('event_id', eventId)
        .eq('team_id', team_id)

      if (error) throw error

      return NextResponse.json({ success: true, cleared: true })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Clear all eliminations for an event (reset)
export async function DELETE(request, { params }) {
  try {
    const { eventId } = await params

    const { error } = await supabaseAdmin
      .from('team_eliminations')
      .delete()
      .eq('event_id', eventId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
