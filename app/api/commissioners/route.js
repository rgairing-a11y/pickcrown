import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if already registered
    const { data: existing } = await supabase
      .from('commissioners')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered as a commissioner' },
        { status: 400 }
      )
    }

    // Insert new commissioner
    const { data, error } = await supabase
      .from('commissioners')
      .insert({
        name: name.trim(),
        email: normalizedEmail
      })
      .select()
      .single()

    if (error) {
      console.error('Commissioner signup error:', error)
      
      // Handle case where table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Commissioner signup is not yet enabled. Please contact the admin.' },
          { status: 500 }
        )
      }
      
      throw error
    }

    return NextResponse.json({ success: true, commissioner: data })
  } catch (error) {
    console.error('Error in commissioner signup:', error)
    return NextResponse.json(
      { error: 'Failed to sign up. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      // Check if specific email is a commissioner
      const { data } = await supabase
        .from('commissioners')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      return NextResponse.json({ isCommissioner: !!data, commissioner: data })
    }

    // Return all commissioners (admin only in future)
    const { data, error } = await supabase
      .from('commissioners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching commissioners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissioners' },
      { status: 500 }
    )
  }
}
