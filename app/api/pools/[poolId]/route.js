import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()
    const { poolId } = params
    
    // Get actor email from request
    const actorEmail = request.headers.get('x-user-email') || 'system'
    
    // Get pool details before deletion for audit log
    const { data: pool } = await supabase
      .from('pools')
      .select('name, event_id')
      .eq('id', poolId)
      .single()
    
    // Log the deletion
    await supabase.rpc('log_audit_event', {
      p_action: 'delete_pool',
      p_actor_email: actorEmail,
      p_target_type: 'pool',
      p_target_id: poolId,
      p_metadata: { pool_name: pool?.name, event_id: pool?.event_id }
    })
    
    // Delete the pool (cascades to entries, picks, etc.)
    const { error } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pool:', error)
    return NextResponse.json(
      { error: 'Failed to delete pool' },
      { status: 500 }
    )
  }
}