import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Add event to season
export async function POST(request) {
  const supabase = getSupabaseAdmin()
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
  const supabase = getSupabaseAdmin()
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
