import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        pools (*),
        season:seasons(id, name)
      `)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('[ADMIN EVENTS FETCH ERROR]', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load events',
          hint: 'Check server logs for details'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      events: data ?? []
    })
  } catch (err) {
    console.error('[ADMIN EVENTS UNHANDLED ERROR]', err)

    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
        hint: 'See server logs'
      },
      { status: 500 }
    )
  }
}
