import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import { assertEventAllowsResults } from '@/lib/assertEventAllowsResults'

export async function PUT(request) {
  const body = await request.json()
  const { categoryId, optionId } = body

  // Fetch category to get event_id
  const { data: category, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('event_id')
    .eq('id', categoryId)
    .single()

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 400 })
  }

  // Fetch event to check status
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id, status')
    .eq('id', category.event_id)
    .single()

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 400 })
  }

  assertEventAllowsResults(event)

  // Unmark all options in category
  await supabaseAdmin
    .from('category_options')
    .update({ is_correct: false })
    .eq('category_id', categoryId)

  // Mark correct option
  const { data, error } = await supabaseAdmin
    .from('category_options')
    .update({ is_correct: true })
    .eq('id', optionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
