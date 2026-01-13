import { NextResponse, NextRequest } from 'next/server'
import { getAdminClient } from '../../../lib/supabase/clients'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await getAdminClient()
    .from('category_options')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  const { data, error } = await getAdminClient()
    .from('category_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await getAdminClient()
    .from('category_options')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}