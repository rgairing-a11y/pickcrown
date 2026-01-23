import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'
import { assertEventAllowsResultsWrite } from '@/lib/assertEventAllowsResults'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { categoryId } = await params

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  const body = await request.json()
  const winner_option_id = body?.winner_option_id

  if (!winner_option_id) {
    return NextResponse.json(
      { success: false, error: 'winner_option_id is required' },
      { status: 400 }
    )
  }

  // 1️⃣ Load category
  const { data: category } = await supabase
    .from('categories')
    .select('*, event:events(id, status)')
    .eq('id', categoryId)
    .single()

  if (!category) {
    await logAudit({
      action: 'set_category_winner',
      target_type: 'category',
      target_id: categoryId,
      metadata: {
        success: false,
        error_message: 'Category not found',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Category not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 1a️⃣ Guard: event must allow result writes
  try {
    assertEventAllowsResultsWrite(category.event)
  } catch (err: any) {
    await logAudit({
      action: 'set_category_winner',
      target_type: 'category',
      target_id: categoryId,
      metadata: {
        success: false,
        error_message: err.message,
        event_status: category.event?.status,
        guardrail_type: 'event_status_check',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: err.message, code: 'FORBIDDEN' },
      { status: err.status || 403 }
    )
  }

  // 2️⃣ Guardrail: winner already set
  if (category.winner_option_id && !force) {
    await logAudit({
      action: 'set_category_winner',
      target_type: 'category',
      target_id: categoryId,
      metadata: {
        success: false,
        error_message: 'Winner already set',
        previous_winner_option_id: category.winner_option_id,
        attempted_winner_option_id: winner_option_id,
        guardrail_type: 'winner_already_set',
        force
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Winner already set',
        code: 'CONFLICT',
        hint: 'Use ?force=true to override'
      },
      { status: 409 }
    )
  }

  // 3️⃣ Validate option belongs to category
  const { data: option } = await supabase
    .from('category_options')
    .select('id')
    .eq('id', winner_option_id)
    .eq('category_id', categoryId)
    .single()

  if (!option) {
    await logAudit({
      action: 'set_category_winner',
      target_type: 'category',
      target_id: categoryId,
      metadata: {
        success: false,
        error_message: 'Invalid winner for category',
        attempted_winner_option_id: winner_option_id,
        guardrail_type: 'invalid_option',
        force
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Winner does not belong to this category',
        code: 'INVALID_WINNER'
      },
      { status: 400 }
    )
  }

  // 4️⃣ Update category
  const { error: updateError } = await supabase
    .from('categories')
    .update({ winner_option_id })
    .eq('id', categoryId)

  if (updateError) {
    await logAudit({
      action: 'set_category_winner',
      target_type: 'category',
      target_id: categoryId,
      metadata: {
        success: false,
        error_message: updateError.message,
        attempted_winner_option_id: winner_option_id,
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Failed to set winner' },
      { status: 500 }
    )
  }

  // 5️⃣ Audit success
  await logAudit({
    action: 'set_category_winner',
    target_type: 'category',
    target_id: categoryId,
    metadata: {
      success: true,
      previous_winner_option_id: category.winner_option_id,
      new_winner_option_id: winner_option_id,
      force
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      category_id: categoryId,
      winner_option_id
    }
  })
}
