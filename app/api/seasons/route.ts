import { NextResponse, NextRequest } from 'next/server'
import { getAdminClient } from '@/lib/supabase/clients'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const { data, error } = await getAdminClient()
        .from('seasons')
        .select('*, events(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    const { data, error } = await getAdminClient()
      .from('seasons')
      .select('*, events(*)')
      .order('year', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, year } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await getAdminClient()
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Season ID is required' }, { status: 400 })
    }

    // First, remove season_id from all events in this season
    await getAdminClient()
      .from('events')
      .update({ season_id: null })
      .eq('season_id', id)

    // Then delete the season
    const { error } = await getAdminClient()
      .from('seasons')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
