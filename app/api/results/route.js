import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { assertEventAllowsResultsWrite } from '@/lib/assertEventAllowsResults'

export async function PUT(request) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.json()
  const { categoryId, optionId } = body

  // Load category and event to check status
  const { data: category, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id, event_id')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id, status')
    .eq('id', category.event_id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Guard: event must allow result writes
  try {
    assertEventAllowsResultsWrite(event)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 })
  }

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
