import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Add event to season
export async function POST(request) {
  try {
    const { seasonId, eventId } = await request.json()

    if (!seasonId || !eventId) {
      return NextResponse.json(
        { error: 'Season ID and Event ID are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('events')
      .update({ season_id: seasonId })
      .eq('id', eventId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Remove event from season
export async function DELETE(request) {
  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('events')
      .update({ season_id: null })
      .eq('id', eventId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
