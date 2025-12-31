import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const actorEmail = searchParams.get('actor_email')
    
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (actorEmail) {
      query = query.eq('actor_email', actorEmail)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ logs: data })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}