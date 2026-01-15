import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { poolId } = await params
    const { status } = await request.json()
    
    // Update pool status
    const { error } = await supabaseAdmin
      .from('pools')
      .update({ status })
      .eq('id', poolId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating pool status:', error)
    return NextResponse.json({ error: 'Failed to update pool status' }, { status: 500 })
  }
}