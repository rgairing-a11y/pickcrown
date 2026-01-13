import { NextResponse, NextRequest } from 'next/server'
import { getAdminClient } from '../../../lib/supabase/clients'

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { categoryId, optionId } = body

  // Unmark all options in category
  await getAdminClient()
    .from('category_options')
    .update({ is_correct: false })
    .eq('category_id', categoryId)

  // Mark correct option
  const { data, error } = await getAdminClient()
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