// app/api/entries/[entryId]/edit/route.js
// API route for editing entries with deadline enforcement

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateEditRequest, getEditStatus } from '@/lib/entry-editing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { entryId } = params;
    const body = await request.json();
    const { picks, email } = body;

    // Validate required fields
    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    if (!picks) {
      return NextResponse.json(
        { error: 'Picks data is required' },
        { status: 400 }
      );
    }

    // Fetch entry with pool and event data
    const { data: entry, error: entryError } = await supabase
      .from('pool_entries')
      .select(`
        *,
        pools (
          id,
          name,
          event_id,
          events (
            id,
            name,
            lock_time,
            start_time,
            status
          )
        )
      `)
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { 
          error: 'Entry not found',
          suggestion: 'Check that you have the correct entry ID',
        },
        { status: 404 }
      );
    }

    // Verify email matches (basic auth)
    if (email && entry.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { 
          error: 'Email does not match entry',
          suggestion: 'Make sure you are editing your own entry',
        },
        { status: 403 }
      );
    }

    const event = entry.pools?.events;
    if (!event) {
      return NextResponse.json(
        { error: 'Event data not found' },
        { status: 500 }
      );
    }

    // Validate edit is allowed (deadline enforcement)
    const lockTime = event.lock_time || event.start_time;
    const editStatus = getEditStatus(
      lockTime,
      entry.created_at,
      entry.edit_count || 0
    );

    if (!editStatus.canEdit) {
      return NextResponse.json(
        { 
          error: editStatus.message,
          reason: editStatus.reason,
          lockTime: editStatus.lockTime,
        },
        { status: 423 } // Locked
      );
    }

    // Calculate what changed (for audit)
    const previousPicks = entry.picks || {};
    const changes = calculateChanges(previousPicks, picks);

    // Update the entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('pool_entries')
      .update({
        picks,
        updated_at: new Date().toISOString(),
        edit_count: (entry.edit_count || 0) + 1,
        last_edit_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to save changes',
          suggestion: 'Please try again in a moment',
        },
        { status: 500 }
      );
    }

    // Log the edit for audit trail (optional - if you have an audit table)
    try {
      await logEdit(entryId, entry.email, changes);
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      changesCount: changes.count,
      editStatus: getEditStatus(lockTime, entry.created_at, (entry.edit_count || 0) + 1),
      message: `${changes.count} pick${changes.count !== 1 ? 's' : ''} updated successfully`,
    });

  } catch (error) {
    console.error('Edit entry error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        suggestion: 'Please try again or contact support if the problem persists',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check edit status without making changes
 */
export async function GET(request, { params }) {
  try {
    const { entryId } = params;

    const { data: entry, error } = await supabase
      .from('pool_entries')
      .select(`
        id,
        created_at,
        updated_at,
        edit_count,
        pools (
          events (
            lock_time,
            start_time,
            status
          )
        )
      `)
      .eq('id', entryId)
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const event = entry.pools?.events;
    const lockTime = event?.lock_time || event?.start_time;

    const editStatus = getEditStatus(
      lockTime,
      entry.created_at,
      entry.edit_count || 0
    );

    return NextResponse.json({
      entryId,
      editStatus,
      editCount: entry.edit_count || 0,
      lastUpdated: entry.updated_at,
    });

  } catch (error) {
    console.error('Get edit status error:', error);
    return NextResponse.json(
      { error: 'Failed to check edit status' },
      { status: 500 }
    );
  }
}

/**
 * Calculate what picks changed
 */
function calculateChanges(oldPicks, newPicks) {
  const changes = {
    count: 0,
    added: [],
    removed: [],
    modified: [],
  };

  // Compare category picks
  const oldCats = oldPicks.categories || {};
  const newCats = newPicks.categories || {};
  
  const allCatIds = new Set([...Object.keys(oldCats), ...Object.keys(newCats)]);
  for (const catId of allCatIds) {
    if (oldCats[catId] !== newCats[catId]) {
      changes.count++;
      if (!oldCats[catId]) {
        changes.added.push({ type: 'category', id: catId });
      } else if (!newCats[catId]) {
        changes.removed.push({ type: 'category', id: catId });
      } else {
        changes.modified.push({ type: 'category', id: catId, from: oldCats[catId], to: newCats[catId] });
      }
    }
  }

  // Compare bracket picks
  const oldBracket = oldPicks.bracket || {};
  const newBracket = newPicks.bracket || {};
  
  const allMatchIds = new Set([...Object.keys(oldBracket), ...Object.keys(newBracket)]);
  for (const matchId of allMatchIds) {
    if (oldBracket[matchId] !== newBracket[matchId]) {
      changes.count++;
      if (!oldBracket[matchId]) {
        changes.added.push({ type: 'bracket', id: matchId });
      } else if (!newBracket[matchId]) {
        changes.removed.push({ type: 'bracket', id: matchId });
      } else {
        changes.modified.push({ type: 'bracket', id: matchId, from: oldBracket[matchId], to: newBracket[matchId] });
      }
    }
  }

  return changes;
}

/**
 * Log edit for audit trail
 */
async function logEdit(entryId, email, changes) {
  // If you have an audit_log table, insert here
  // For now, just console log
  console.log('Entry edit:', {
    entryId,
    email,
    changesCount: changes.count,
    timestamp: new Date().toISOString(),
  });
}
