import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

// GET - Fetch commissioner by email or ID
export async function GET(request) {
  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const id = searchParams.get('id')

  let query = supabaseAdmin.from('commissioners').select('*')

  if (email) {
    query = query.ilike('email', email)
  } else if (id) {
    query = query.eq('id', id)
  } else {
    return NextResponse.json({ error: 'Email or ID required' }, { status: 400 })
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ exists: false }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// POST - Create new commissioner
export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.json()
  const { email, name, avatar_emoji, avatar_color, bio } = body

  if (!email || !name) {
    return NextResponse.json(
      { error: 'Email and name are required' },
      { status: 400 }
    )
  }

  // Check if commissioner already exists
  const { data: existing } = await supabaseAdmin
    .from('commissioners')
    .select('id')
    .ilike('email', email)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'A commissioner account already exists for this email' },
      { status: 409 }
    )
  }

  // Create commissioner
  const { data, error } = await supabaseAdmin
    .from('commissioners')
    .insert({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      avatar_url: null,
      bio: bio || null,
      pools_created: 0,
      is_verified: false
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// PUT - Update commissioner
export async function PUT(request) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.json()
  const { id, email, ...updates } = body

  if (!id && !email) {
    return NextResponse.json(
      { error: 'ID or email required' },
      { status: 400 }
    )
  }

  let query = supabaseAdmin.from('commissioners').update(updates)

  if (id) {
    query = query.eq('id', id)
  } else {
    query = query.ilike('email', email)
  }

  const { data, error } = await query.select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
