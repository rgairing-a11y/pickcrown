export function assertEventAllowsResults(event: { id: string; status: string }) {
  if (event.status !== 'locked') {
    throw new Error(
      `Results cannot be modified unless event status is 'locked'. Current status: '${event.status}'`
    )
  }
}
