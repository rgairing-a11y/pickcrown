import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = createClient()
    const { eventId } = params
    
    const actorEmail = request.headers.get('x-user-email') || 'system'
    
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('name, status')
      .eq('id', eventId)
      .single()
    
    // Update event status to completed
    const { error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
    
    if (error) throw error
    
    // Log the action
    await supabase.rpc('log_audit_event', {
      p_action: 'mark_event_complete',
      p_actor_email: actorEmail,
      p_target_type: 'event',
      p_target_id: eventId,
      p_metadata: { event_name: event?.name, previous_status: event?.status }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking event complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark event complete' },
      { status: 500 }
    )
  }
}