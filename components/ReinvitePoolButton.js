'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReinvitePoolButton({ poolId, poolName }) {
  const router = useRouter()
  const [isReinviting, setIsReinviting] = useState(false)
  const [showEventSelector, setShowEventSelector] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [availableEvents, setAvailableEvents] = useState([])
  
  const loadEvents = async () => {
    const response = await fetch('/api/events?status=upcoming')
    const data = await response.json()
    setAvailableEvents(data.events || [])
    setShowEventSelector(true)
  }
  
  const handleReinvite = async () => {
    if (!selectedEventId) {
      alert('Please select an event')
      return
    }
    
    setIsReinviting(true)
    try {
      const response = await fetch(`/api/pools/${poolId}/reinvite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': localStorage.getItem('userEmail') || ''
        },
        body: JSON.stringify({ newEventId: selectedEventId })
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      alert(`Successfully created new pool with ${data.entryCount} entries!`)
      router.push(`/pool/${data.newPoolId}/manage`)
    } catch (error) {
      console.error('Reinvite error:', error)
      alert('Failed to create new pool. Please try again.')
    } finally {
      setIsReinviting(false)
      setShowEventSelector(false)
    }
  }
  
  return (
    <>
      <button
        onClick={loadEvents}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reuse Pool for New Event
      </button>
      
      {showEventSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Reuse "{poolName}" for New Event
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              All participants will be copied to the new pool. They'll need to submit new picks.
            </p>
            
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2 border rounded mb-6"
            >
              <option value="">Select an event...</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.lock_time).toLocaleDateString()}
                </option>
              ))}
            </select>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowEventSelector(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReinvite}
                disabled={!selectedEventId || isReinviting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isReinviting ? 'Creating...' : 'Create New Pool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}