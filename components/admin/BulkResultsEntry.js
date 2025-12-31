'use client'

import { useState } from 'react'

export default function BulkResultsEntry({ eventId, matchups, categories }) {
  const [results, setResults] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const bulkResults = [
        ...matchups.map(m => ({
          matchupId: m.id,
          winnerId: results[`matchup-${m.id}`]
        })).filter(r => r.winnerId),
        ...categories.map(c => ({
          categoryId: c.id,
          winnerId: results[`category-${c.id}`]
        })).filter(r => r.winnerId)
      ]
      
      const response = await fetch('/api/results/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': localStorage.getItem('userEmail') || ''
        },
        body: JSON.stringify({ eventId, results: bulkResults })
      })
      
      const data = await response.json()
      
      if (data.errors && data.errors.length > 0) {
        alert(`Updated ${data.updated} results with ${data.errors.length} errors:\n${data.errors.join('\n')}`)
      } else {
        alert(`Successfully updated ${data.updated} results!`)
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      alert('Failed to update results. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Bulk Results Entry</h2>
      
      {matchups && matchups.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Bracket Matchups</h3>
          <div className="space-y-3">
            {matchups.map(matchup => (
              <div key={matchup.id} className="border p-4 rounded">
                <p className="font-medium mb-2">{matchup.description}</p>
                <select
                  value={results[`matchup-${matchup.id}`] || ''}
                  onChange={(e) => setResults(prev => ({
                    ...prev,
                    [`matchup-${matchup.id}`]: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select winner...</option>
                  {matchup.teams && matchup.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {categories && categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Categories</h3>
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="border p-4 rounded">
                <p className="font-medium mb-2">{category.question}</p>
                <select
                  value={results[`category-${category.id}`] || ''}
                  onChange={(e) => setResults(prev => ({
                    ...prev,
                    [`category-${category.id}`]: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select answer...</option>
                  {category.options && category.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.text}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(results).length === 0}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : `Submit ${Object.keys(results).length} Results`}
      </button>
    </div>
  )
}