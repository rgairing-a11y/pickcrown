import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(request, { params }) {
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