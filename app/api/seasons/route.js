import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

export async function GET(request) {
  const supabase = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const { data, error } = await supabase
        .from('seasons')
        .select('*, events(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from('seasons')
      .select('*, events(*)')
      .order('year', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json()
    const { name, description, year } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('seasons')
      .insert({
        name,
        description: description || null,
        year: year || new Date().getFullYear()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const supabase = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Season ID is required' }, { status: 400 })
    }

    // First, remove season_id from all events in this season
    await supabase
      .from('events')
      .update({ season_id: null })
      .eq('season_id', id)

    // Then delete the season
    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
