import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { poolId } = await params
    
    // First delete pool entries (picks will cascade from entries)
    await supabaseAdmin
      .from('pool_entries')
      .delete()
      .eq('pool_id', poolId)
    
    // Then delete the pool itself
    const { error } = await supabaseAdmin
      .from('pools')
      .delete()
      .eq('id', poolId)
    
    if (error) {
      console.error('Error deleting pool:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting pool:', error)
    return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { poolId } = await params
    const body = await request.json()
    
    const { error } = await supabaseAdmin
      .from('pools')
      .update(body)
      .eq('id', poolId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating pool:', error)
    return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
  }
}