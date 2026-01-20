import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { assertEventAllowsResults } from '@/lib/assertEventAllowsResults'
import { logAudit } from '@/lib/audit'

export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { eventId } = await params

    const actorEmail = request.headers.get('x-user-email') || 'system'

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, status')
      .eq('id', eventId)
      .single()

    if (eventError) {
      throw eventError
    }

    assertEventAllowsResults(event)

    // Update event status to completed
    const { error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)

    if (error) throw error

    // Log the action
    try {
      await logAudit({
        action: 'mark_event_complete',
        actor_email: actorEmail,
        target_type: 'event',
        target_id: eventId,
        metadata: { event_name: event?.name, previous_status: event?.status }
      })
    } catch (e) {
      // Audit log function may not exist yet
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking event complete:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark event complete' },
      { status: 500 }
    )
  }
}
