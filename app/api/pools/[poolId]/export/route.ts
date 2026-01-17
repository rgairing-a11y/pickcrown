import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { poolId } = await params

    // Get pool info
    const { data: pool } = await supabaseAdmin
      .from('pools')
      .select('name, event:events(name, year)')
      .eq('id', poolId)
      .single() as { data: { name: string; event: { name: string; year: number } } | null }

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Get standings
    const { data: standings, error } = await supabaseAdmin
      .rpc('calculate_standings', { p_pool_id: poolId })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Build CSV
    const headers = ['Rank', 'Entry Name', 'Email', 'Points']
    const rows = standings.map((entry: any) => [
      entry.rank,
      `"${entry.entry_name}"`,
      `"${entry.email || ''}"`,
      entry.total_points
    ])

    const csv = [
      `# ${pool.name} - ${pool.event?.name} ${pool.event?.year}`,
      `# Exported: ${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows.map((row: any) => row.join(','))
    ].join('\n')

    // Return as downloadable CSV
    const filename = `${pool.name.replace(/[^a-z0-9]/gi, '_')}_standings.csv`
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err: any) {
    console.error('CSV export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
