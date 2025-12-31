import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { poolId } = params
    const { newEventId } = await request.json()
    
    const actorEmail = request.headers.get('x-user-email') || 'system'
    
    // Get original pool details
    const { data: originalPool, error: poolError } = await supabase
      .from('pools')
      .select('name, commissioner_email, commissioner_name')
      .eq('id', poolId)
      .single()
    
    if (poolError) throw poolError
    
    // Get all entries from original pool
    const { data: entries, error: entriesError } = await supabase
      .from('pool_entries')
      .select('email, entry_name')
      .eq('pool_id', poolId)
    
    if (entriesError) throw entriesError
    
    // Create new pool for the new event
    const { data: newPool, error: newPoolError } = await supabase
      .from('pools')
      .insert({
        event_id: newEventId,
        name: originalPool.name,
        commissioner_email: originalPool.commissioner_email,
        commissioner_name: originalPool.commissioner_name,
        status: 'active'
      })
      .select()
      .single()
    
    if (newPoolError) throw newPoolError
    
    // Create entries in new pool (no picks yet)
    if (entries && entries.length > 0) {
      const newEntries = entries.map(entry => ({
        pool_id: newPool.id,
        email: entry.email,
        entry_name: entry.entry_name
      }))
      
      const { error: insertError } = await supabase
        .from('pool_entries')
        .insert(newEntries)
      
      if (insertError) throw insertError
    }
    
    // Log the action
    await supabase.rpc('log_audit_event', {
      p_action: 'reinvite_pool',
      p_actor_email: actorEmail,
      p_target_type: 'pool',
      p_target_id: newPool.id,
      p_metadata: {
        original_pool_id: poolId,
        new_event_id: newEventId,
        entries_count: entries?.length || 0
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      newPoolId: newPool.id,
      entryCount: entries?.length || 0
    })
  } catch (error) {
    console.error('Error reinviting pool:', error)
    return NextResponse.json(
      { error: 'Failed to reinvite pool' },
      { status: 500 }
    )
  }
}