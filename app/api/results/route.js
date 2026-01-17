import { NextResponse } from 'next/server'
import { getsupabaseAdmin } from '../../../lib/supabase-admin'

export async function PUT(request) {
  const body = await request.json()
  const { categoryId, optionId } = body

  // Unmark all options in category
  await supabaseAdmin
    .from('category_options')
    .update({ is_correct: false })
    .eq('category_id', categoryId)

  // Mark correct option
  const supabase = getSupabaseAdmin()
  const { data, error } = await getsupabase
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