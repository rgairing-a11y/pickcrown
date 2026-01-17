import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Add event to season
export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { seasonId, eventId } = await request.json()

    if (!seasonId || !eventId) {
      return NextResponse.json(
        { error: 'Season ID and Event ID are required' },
        { status: 400 }
      )
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error - missing admin key' },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update({ season_id: seasonId })
      .eq('id', eventId)
      .select()

    if (error) {
      console.error('Update event error:', error)
      throw error
    }

    console.log('Added event to season:', { eventId, seasonId, result: data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/seasons/events error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Remove event from season
export async function DELETE(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error - missing admin key' },
        { status: 500 }
      )
    }

    const { error } = await supabaseAdmin
      .from('events')
      .update({ season_id: null })
      .eq('id', eventId)

    if (error) {
      console.error('Remove event error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/seasons/events error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
