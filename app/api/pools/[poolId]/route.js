import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

export async function DELETE(request, { params }) {
  const supabase = getSupabaseAdmin()
  try {
    const { poolId } = await params

    // First delete pool entries (picks will cascade from entries)
    await supabase
      .from('pool_entries')
      .delete()
      .eq('pool_id', poolId)
    
    // Then delete the pool itself
    const { error } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId)
    
    if (error) {
      console.error('Error deleting pool:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pool:', error)
    return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const supabase = getSupabaseAdmin()
  try {
    const { poolId } = await params
    const body = await request.json()
    
    const { error } = await supabase
      .from('pools')
      .update(body)
      .eq('id', poolId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating pool:', error)
    return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
  }
}