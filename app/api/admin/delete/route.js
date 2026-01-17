import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

export async function DELETE(request) {
  const supabase = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'pool' or 'event'
    const id = searchParams.get('id')
    
    if (!id || !type) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Add it to your environment variables.',
        hint: 'In Vercel, go to Settings → Environment Variables'
      }, { status: 500 })
    }

    console.log(`Admin delete: ${type} ${id}`)

    if (type === 'pool') {
      return await deletePool(id)
    } else if (type === 'event') {
      return await deleteEvent(id)
    } else {
      return NextResponse.json({ error: 'Invalid type. Use pool or event' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function deletePool(poolId) {
  const supabase = getSupabaseAdmin()
  const errors = []

  // 1. Get pool entries
  const { data: entries, error: entriesError } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('pool_id', poolId)
  
  if (entriesError) {
    errors.push(`entries lookup: ${entriesError.message}`)
  }
  
  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id)
    
    // Delete bracket picks
    const { error: bpError } = await supabase
      .from('bracket_picks')
      .delete()
      .in('pool_entry_id', entryIds)
    if (bpError) errors.push(`bracket_picks: ${bpError.message}`)
    
    // Delete category picks
    const { error: cpError } = await supabase
      .from('category_picks')
      .delete()
      .in('pool_entry_id', entryIds)
    if (cpError) errors.push(`category_picks: ${cpError.message}`)
  }
  
  // Delete pool entries
  const { error: peError } = await supabase
    .from('pool_entries')
    .delete()
    .eq('pool_id', poolId)
  if (peError) errors.push(`pool_entries: ${peError.message}`)
  
  // Delete pool
  const { error: poolError } = await supabase
    .from('pools')
    .delete()
    .eq('id', poolId)
  if (poolError) errors.push(`pools: ${poolError.message}`)
  
  if (errors.length > 0) {
    return NextResponse.json({ 
      success: false, 
      errors,
      hint: 'Check RLS policies or run: ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;'
    }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, deleted: 'pool', id: poolId })
}

async function deleteEvent(eventId) {
  const supabase = getSupabaseAdmin()
  const errors = []

  // 1. Get pools for this event
  const { data: pools } = await supabase
    .from('pools')
    .select('id')
    .eq('event_id', eventId)
  
  // Delete each pool
  if (pools && pools.length > 0) {
    for (const pool of pools) {
      const result = await deletePool(pool.id)
      const data = await result.json()
      if (!data.success) {
        errors.push(`pool ${pool.id}: ${JSON.stringify(data.errors)}`)
      }
    }
  }
  
  // 2. Delete matchups
  const { error: matchupError } = await supabase
    .from('matchups')
    .delete()
    .eq('event_id', eventId)
  if (matchupError) errors.push(`matchups: ${matchupError.message}`)
  
  // 3. Get categories and delete options
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('event_id', eventId)
  
  if (categories && categories.length > 0) {
    const catIds = categories.map(c => c.id)
    const { error: optError } = await supabase
      .from('category_options')
      .delete()
      .in('category_id', catIds)
    if (optError) errors.push(`category_options: ${optError.message}`)
  }
  
  // 4. Delete categories
  const { error: catError } = await supabase
    .from('categories')
    .delete()
    .eq('event_id', eventId)
  if (catError) errors.push(`categories: ${catError.message}`)
  
  // 5. Delete teams
  const { error: teamError } = await supabase
    .from('teams')
    .delete()
    .eq('event_id', eventId)
  if (teamError) errors.push(`teams: ${teamError.message}`)
  
  // 6. Delete rounds
  const { error: roundError } = await supabase
    .from('rounds')
    .delete()
    .eq('event_id', eventId)
  if (roundError) errors.push(`rounds: ${roundError.message}`)
  
  // 7. Delete phases
  const { error: phaseError } = await supabase
    .from('phases')
    .delete()
    .eq('event_id', eventId)
  if (phaseError) errors.push(`phases: ${phaseError.message}`)
  
  // 8. Delete event
  const { error: eventError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
  if (eventError) errors.push(`events: ${eventError.message}`)
  
  if (errors.length > 0) {
    return NextResponse.json({ 
      success: false, 
      errors,
      hint: 'Check RLS policies or foreign key constraints'
    }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, deleted: 'event', id: eventId })
}

// GET for testing/diagnostics
export async function GET(request) {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  
  return NextResponse.json({
    status: 'Admin delete API ready',
    config: {
      supabaseUrl: hasUrl ? '✅ Set' : '❌ Missing',
      serviceRoleKey: hasServiceKey ? '✅ Set' : '❌ Missing SUPABASE_SERVICE_ROLE_KEY'
    },
    usage: {
      deletePool: 'DELETE /api/admin/delete?type=pool&id=<pool-uuid>',
      deleteEvent: 'DELETE /api/admin/delete?type=event&id=<event-uuid>'
    }
  })
}
