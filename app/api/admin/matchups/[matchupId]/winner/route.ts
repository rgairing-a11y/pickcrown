import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'
import { assertEventAllowsResultsWrite } from '@/lib/assertEventAllowsResults'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchupId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { matchupId } = await params

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  const { winner_team_id } = await request.json()

  if (!winner_team_id) {
    return NextResponse.json(
      { success: false, error: 'winner_team_id is required' },
      { status: 400 }
    )
  }

  // 1️⃣ Load matchup
  const { data: matchup } = await supabase
    .from('matchups')
    .select('*, event:events(id, status)')
    .eq('id', matchupId)
    .single()

  if (!matchup) {
    await logAudit({
      action: 'set_matchup_winner',
      target_type: 'matchup',
      target_id: matchupId,
      metadata: {
        success: false,
        error_message: 'Matchup not found',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Matchup not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 1a️⃣ Guard: event must allow result writes
  try {
    assertEventAllowsResultsWrite(matchup.event)
  } catch (err: any) {
    await logAudit({
      action: 'set_matchup_winner',
      target_type: 'matchup',
      target_id: matchupId,
      metadata: {
        success: false,
        error_message: err.message,
        event_status: matchup.event?.status,
        guardrail_type: 'event_status_check',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: err.message, code: 'FORBIDDEN' },
      { status: err.status || 403 }
    )
  }

  // 2️⃣ Guardrail: already has winner
  if (matchup.winner_team_id && !force) {
    await logAudit({
      action: 'set_matchup_winner',
      target_type: 'matchup',
      target_id: matchupId,
      metadata: {
        success: false,
        error_message: 'Winner already set',
        previous_winner_team_id: matchup.winner_team_id,
        attempted_winner_team_id: winner_team_id,
        guardrail_type: 'winner_already_set',
        force
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Winner already set',
        code: 'CONFLICT',
        hint: 'Use ?force=true to override'
      },
      { status: 409 }
    )
  }

  // 3️⃣ Guardrail: validate team belongs to matchup (NORMALIZED)
const winner = String(winner_team_id)
const teamA = String(matchup.team_a_id)
const teamB = String(matchup.team_b_id)

const validWinner = winner === teamA || winner === teamB

if (!validWinner) {
  await logAudit({
    action: 'set_matchup_winner',
    target_type: 'matchup',
    target_id: matchupId,
    metadata: {
      success: false,
      error_message: 'Invalid winner for matchup',
      attempted_winner_team_id: winner,
      team_a_id: teamA,
      team_b_id: teamB,
      guardrail_type: 'invalid_winner',
      force
    }
  })

  return NextResponse.json(
    {
      success: false,
      error: 'Winner does not belong to this matchup',
      code: 'INVALID_WINNER'
    },
    { status: 400 }
  )
}

  // 4️⃣ Update matchup
  const { error: updateError } = await supabase
    .from('matchups')
    .update({ winner_team_id })
    .eq('id', matchupId)

  if (updateError) {
    await logAudit({
      action: 'set_matchup_winner',
      target_type: 'matchup',
      target_id: matchupId,
      metadata: {
        success: false,
        error_message: updateError.message,
        attempted_winner_team_id: winner_team_id,
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Failed to set winner' },
      { status: 500 }
    )
  }

  // 5️⃣ Audit success
  await logAudit({
    action: 'set_matchup_winner',
    target_type: 'matchup',
    target_id: matchupId,
    metadata: {
      success: true,
      previous_winner_team_id: matchup.winner_team_id,
      new_winner_team_id: winner_team_id,
      force
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      matchup_id: matchupId,
      winner_team_id
    }
  })
}
