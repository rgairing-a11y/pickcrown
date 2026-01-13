import { NextResponse, NextRequest } from 'next/server'
import { getAdminClient } from '@/lib/supabase/clients'

const supabase = getAdminClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .order('conference', { nullsFirst: false })
    .order('seed', { nullsFirst: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { eventId, name, seed, conference } = body

  if (!eventId || !name) {
    return NextResponse.json({ error: 'Event ID and name required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('teams')
    .insert({
      event_id: eventId,
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
      conference: conference || null
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, name, seed, conference } = body

  if (!id) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
  }

  const updates = {}
  if (name !== undefined) updates.name = name
  if (seed !== undefined) updates.seed = seed || null
  if (conference !== undefined) updates.conference = conference || null

  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}