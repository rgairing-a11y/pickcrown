import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assertEventAllowsResultsWrite, assertEventAllowsResultsRead } from '@/lib/assertEventAllowsResults'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

// GET - Fetch all eliminations for an event
export async function GET(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { eventId } = await params

    // Load event to check status
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, status')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Guard: event must allow reading results
    try {
      assertEventAllowsResultsRead(event)
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: err.status || 403 })
    }

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
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { eventId } = await params
    const { team_id, eliminated_in_round_id } = await request.json()

    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 })
    }

    // Load event to check status
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, status')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Guard: event must allow writing results
    try {
      assertEventAllowsResultsWrite(event)
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: err.status || 403 })
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
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { eventId } = await params

    // Load event to check status
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, status')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Guard: event must allow writing results
    try {
      assertEventAllowsResultsWrite(event)
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: err.status || 403 })
    }

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
