import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateEventRequest, UpdateEventRequest, Event, ApiErrorResponse } from '../../../lib/types'

export async function POST(request: NextRequest): Promise<NextResponse<Event | ApiErrorResponse>> {
  const body = await request.json() as CreateEventRequest

  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('events')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest): Promise<NextResponse<Event | ApiErrorResponse>> {
  const body = await request.json() as UpdateEventRequest
  const { id, ...updates } = body

  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function GET(request: NextRequest): Promise<NextResponse<Event | Event[] | ApiErrorResponse>> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // If no id, return all events (or handle as needed)
  if (!id) {
    const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ).from('events').select('*')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  }

  // Get specific event
  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}