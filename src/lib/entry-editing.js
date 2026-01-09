// lib/entry-editing.js
// Entry editing utilities with deadline enforcement

/**
 * Configuration for edit windows
 * Edit cutoff is X hours before the event/phase locks
 */
export const EDIT_CONFIG = {
  // Hours before lock time when edits are disabled
  CUTOFF_HOURS: 2,
  
  // Minimum time after submission before editing is allowed (prevents rapid changes)
  MIN_WAIT_MINUTES: 5,
  
  // Maximum edits allowed per entry (0 = unlimited)
  MAX_EDITS: 0,
};

/**
 * Calculate if editing is allowed based on lock time
 * @param {Date|string} lockTime - When picks lock
 * @param {Date|string} submittedAt - When entry was originally submitted
 * @param {number} editCount - Number of times entry has been edited
 * @returns {Object} Edit status with reason if not allowed
 */
export function getEditStatus(lockTime, submittedAt = null, editCount = 0) {
  const now = new Date();
  const lock = new Date(lockTime);
  const cutoffTime = new Date(lock.getTime() - (EDIT_CONFIG.CUTOFF_HOURS * 60 * 60 * 1000));
  
  // Check if already locked
  if (now >= lock) {
    return {
      canEdit: false,
      reason: 'locked',
      message: 'Picks are locked. No changes allowed.',
      lockTime: lock,
    };
  }
  
  // Check if within cutoff window
  if (now >= cutoffTime) {
    const hoursUntilLock = Math.ceil((lock - now) / (1000 * 60 * 60));
    const minutesUntilLock = Math.ceil((lock - now) / (1000 * 60));
    
    return {
      canEdit: false,
      reason: 'cutoff',
      message: `Editing disabled ${EDIT_CONFIG.CUTOFF_HOURS} hours before lock. ${minutesUntilLock < 60 ? `${minutesUntilLock} minutes` : `${hoursUntilLock} hours`} until picks lock.`,
      lockTime: lock,
      cutoffTime,
    };
  }
  
  // Check minimum wait time after submission
  if (submittedAt) {
    const submitted = new Date(submittedAt);
    const minWaitTime = new Date(submitted.getTime() + (EDIT_CONFIG.MIN_WAIT_MINUTES * 60 * 1000));
    
    if (now < minWaitTime) {
      const minutesRemaining = Math.ceil((minWaitTime - now) / (1000 * 60));
      return {
        canEdit: false,
        reason: 'too_soon',
        message: `Please wait ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} before editing.`,
        waitUntil: minWaitTime,
      };
    }
  }
  
  // Check max edits
  if (EDIT_CONFIG.MAX_EDITS > 0 && editCount >= EDIT_CONFIG.MAX_EDITS) {
    return {
      canEdit: false,
      reason: 'max_edits',
      message: `Maximum edits (${EDIT_CONFIG.MAX_EDITS}) reached for this entry.`,
      editCount,
    };
  }
  
  // Calculate time remaining in edit window
  const msUntilCutoff = cutoffTime - now;
  const hoursUntilCutoff = Math.floor(msUntilCutoff / (1000 * 60 * 60));
  const minutesUntilCutoff = Math.floor((msUntilCutoff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    canEdit: true,
    reason: 'allowed',
    message: `Edit window open. ${hoursUntilCutoff > 0 ? `${hoursUntilCutoff}h ` : ''}${minutesUntilCutoff}m until editing closes.`,
    lockTime: lock,
    cutoffTime,
    timeRemaining: {
      hours: hoursUntilCutoff,
      minutes: minutesUntilCutoff,
      total_ms: msUntilCutoff,
    },
  };
}

/**
 * Format the edit window status for display
 * @param {Object} editStatus - Result from getEditStatus
 * @returns {Object} Formatted display properties
 */
export function formatEditStatus(editStatus) {
  if (!editStatus) return null;
  
  const statusStyles = {
    allowed: {
      color: 'var(--color-success, #22c55e)',
      bgColor: 'var(--color-success-light, #dcfce7)',
      icon: '✓',
    },
    cutoff: {
      color: 'var(--color-warning, #f59e0b)',
      bgColor: 'var(--color-warning-light, #fef3c7)',
      icon: '⏰',
    },
    locked: {
      color: 'var(--color-muted, #6b7280)',
      bgColor: 'var(--color-muted-light, #f3f4f6)',
      icon: '🔒',
    },
    too_soon: {
      color: 'var(--color-info, #3b82f6)',
      bgColor: 'var(--color-info-light, #dbeafe)',
      icon: '⏳',
    },
    max_edits: {
      color: 'var(--color-muted, #6b7280)',
      bgColor: 'var(--color-muted-light, #f3f4f6)',
      icon: '✗',
    },
  };
  
  return {
    ...editStatus,
    style: statusStyles[editStatus.reason] || statusStyles.locked,
  };
}

/**
 * Validate that an edit request is allowed (for API use)
 * @param {Object} entry - The pool entry
 * @param {Object} event - The event with lock_time
 * @returns {Object} { allowed: boolean, error?: string }
 */
export function validateEditRequest(entry, event) {
  if (!entry || !event) {
    return { allowed: false, error: 'Invalid entry or event data' };
  }
  
  const lockTime = event.lock_time || event.start_time;
  if (!lockTime) {
    return { allowed: false, error: 'Event has no lock time configured' };
  }
  
  const editStatus = getEditStatus(
    lockTime,
    entry.created_at,
    entry.edit_count || 0
  );
  
  if (!editStatus.canEdit) {
    return { allowed: false, error: editStatus.message };
  }
  
  return { allowed: true };
}

export default {
  EDIT_CONFIG,
  getEditStatus,
  formatEditStatus,
  validateEditRequest,
};
