/**
 * Guard: Assert event allows reading results
 * Allows: in_progress, locked, completed
 * Throws: 403 for any other status
 */
export function assertEventAllowsResultsRead(event: { status?: string }) {
  if (!event) {
    const err: any = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  const allowedStatuses = ['in_progress', 'locked', 'completed'];

  if (!allowedStatuses.includes(event.status || '')) {
    const message = `Results cannot be viewed for events with status "${event.status}". Event must be in_progress, locked, or completed.`;
    const err: any = new Error(message);
    err.status = 403;
    throw err;
  }
}

/**
 * Guard: Assert event allows writing/modifying results
 * Allows: in_progress only
 * Throws: 403 for any other status
 */
export function assertEventAllowsResultsWrite(event: { status?: string }) {
  if (!event) {
    const err: any = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  if (event.status !== 'in_progress') {
    const message = `Results cannot be modified for events with status "${event.status}". Event must be in_progress to modify results.`;
    const err: any = new Error(message);
    err.status = 403;
    throw err;
  }
}
