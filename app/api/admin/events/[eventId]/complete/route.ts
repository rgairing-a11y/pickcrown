import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { eventId } = await params

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  // 1️⃣ Load event
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event || fetchError) {
    await logAudit({
      action: 'complete_event',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: false,
        error_message: 'Event not found',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Event not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 2️⃣ Guardrail: already completed
  if (event.status === 'completed' && !force) {
    await logAudit({
      action: 'complete_event',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: false,
        error_message: 'Event already completed',
        previous_status: event.status,
        blocked_by_guardrail: true,
        guardrail_type: 'already_completed',
        force
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Event already completed',
        code: 'FORBIDDEN',
        hint: 'Use ?force=true to override'
      },
      { status: 403 }
    )
  }

  // 3️⃣ Update status
  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'completed' })
    .eq('id', eventId)

  if (updateError) {
    await logAudit({
      action: 'complete_event',
      target_type: 'event',
      target_id: eventId,
      metadata: {
        success: false,
        error_message: updateError.message,
        previous_status: event.status,
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Failed to complete event' },
      { status: 500 }
    )
  }

  // 4️⃣ Audit success
  await logAudit({
    action: 'complete_event',
    target_type: 'event',
    target_id: eventId,
    metadata: {
      success: true,
      previous_status: event.status,
      new_status: 'completed',
      force
    }
  })

  return NextResponse.json({
    success: true,
    data: { completed: true }
  })
}
