import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 50

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data ?? []
    })
  } catch (err) {
    console.error('[ADMIN AUDIT LOG FETCH ERROR]', err)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load audit log',
        hint: 'Please refresh and try again'
      },
      { status: 500 }
    )
  }
}
