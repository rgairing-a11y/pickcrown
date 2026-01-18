import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('seasons')
      .select(`
        *,
        events (id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN SEASONS FETCH ERROR]', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load seasons' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data ?? []
    })
  } catch (err) {
    console.error('[ADMIN SEASONS FETCH ERROR]', err)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load seasons',
        hint: 'Please refresh and try again'
      },
      { status: 500 }
    )
  }
}
