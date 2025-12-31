import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { poolId } = params
    const { status } = await request.json()
    
    const actorEmail = request.headers.get('x-user-email') || 'system'
    
    // Update pool status
    const { error } = await supabase
      .from('pools')
      .update({ status })
      .eq('id', poolId)
    
    if (error) throw error
    
    // Log the action
    await supabase.rpc('log_audit_event', {
      p_action: status === 'archived' ? 'archive_pool' : 'unarchive_pool',
      p_actor_email: actorEmail,
      p_target_type: 'pool',
      p_target_id: poolId,
      p_metadata: { new_status: status }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating pool status:', error)
    return NextResponse.json(
      { error: 'Failed to update pool status' },
      { status: 500 }
    )
  }
}