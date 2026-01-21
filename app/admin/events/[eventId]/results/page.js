import AdminResultsClient from './AdminResultsClient'

/**
 * Admin Results Page (Server Component)
 *
 * This is a Server Component that extracts the eventId from params
 * and passes it as a primitive value to the Client Component.
 *
 * This follows Next.js 16 App Router rules:
 * - Server Component (no 'use client')
 * - Can be async
 * - Can access params (which is a Promise in Next.js 16)
 * - Passes only primitive values to Client Components
 */
export default async function AdminResultsPage({ params }) {
  // In Next.js 16, params is a Promise that must be awaited
  const resolvedParams = await params
  const { eventId } = resolvedParams

  // Pass only the primitive eventId to the Client Component
  return <AdminResultsClient eventId={eventId} />
}
