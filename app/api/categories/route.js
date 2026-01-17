import { NextResponse } from 'next/server'
import { getsupabaseAdmin } from '../../../lib/supabase-admin'

export async function POST(request) {
  const body = await request.json()
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('categories')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}