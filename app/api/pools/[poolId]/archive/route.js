import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  const supabase = createClient()
  try {
    const { poolId } = await params
    const { status } = await request.json()
    
    // Update pool status
    const { error } = await supabase
      .from('pools')
      .update({ status })
      .eq('id', poolId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating pool status:', error)
    return NextResponse.json({ error: 'Failed to update pool status' }, { status: 500 })
  }
}