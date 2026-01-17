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

export async function PATCH(request, { params }) {
  const supabase = getSupabaseAdmin()
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