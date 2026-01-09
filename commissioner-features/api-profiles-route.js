import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch profile by email
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, commissioner:commissioners(*)')
    .ilike('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile exists - return default
      return NextResponse.json({
        exists: false,
        email: email.toLowerCase(),
        display_name: email.split('@')[0],
        avatar_emoji: '👤',
        avatar_color: '#3b82f6',
        is_commissioner: false
      })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ...data, exists: true })
}

// POST - Create or update profile (upsert)
export async function POST(request) {
  const body = await request.json()
  const { email, display_name, avatar_emoji, avatar_color, is_commissioner, commissioner_id, notification_preferences } = body

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const profileData = {
    email: email.toLowerCase().trim(),
    display_name: display_name || email.split('@')[0],
    avatar_emoji: avatar_emoji || '👤',
    avatar_color: avatar_color || '#3b82f6',
    is_commissioner: is_commissioner || false,
    commissioner_id: commissioner_id || null,
    notification_preferences: notification_preferences || { results: true, reminders: true }
  }

  // Upsert profile
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(profileData, { 
      onConflict: 'email',
      ignoreDuplicates: false 
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// PUT - Update profile
export async function PUT(request) {
  const body = await request.json()
  const { email, ...updates } = body

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .ilike('email', email)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// DELETE - Delete profile
export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .ilike('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
