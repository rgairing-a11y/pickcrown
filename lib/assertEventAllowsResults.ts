export function assertEventAllowsResults(event: { state?: string }) {
  if (!event || event.state !== 'locked') {
    const message =
      'Results can only be entered while the event is locked.';
    const err: any = new Error(message);
    err.status = 403;
    throw err;
  }
}
