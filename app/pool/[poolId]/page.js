'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import PickSubmissionForm from '../../../components/PickSubmissionForm'
import BracketPickForm from '../../../components/BracketPickForm'
import AdvancementPickForm from '../../../components/AdvancementPickForm'
import Link from 'next/link'

export default function PoolPage() {
  const { poolId } = useParams()
  const [pool, setPool] = useState(null)
  const [event, setEvent] = useState(null)
  const [categories, setCategories] = useState([])
  const [rounds, setRounds] = useState([])
  const [matchups, setMatchups] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPool() {
      try {
        // Fetch pool with event
        const { data: poolData, error: poolError } = await supabase
          .from('pools')
          .select(`
            *,
            event:events(*)
          `)
          .eq('id', poolId)
          .single()

        if (poolError) throw poolError
        if (!poolData) throw new Error('Pool not found')

        setPool(poolData)
        setEvent(poolData.event)

        const eventId = poolData.event.id
        const eventType = poolData.event.event_type

        // For pick_one or hybrid events, fetch categories
        if (eventType === 'pick_one' || eventType === 'hybrid') {
          const { data: cats } = await supabase
            .from('categories')
            .select('*, options:category_options(*)')
            .eq('event_id', eventId)
            .order('order_index')

          setCategories(cats || [])
        }

        // For bracket or hybrid events, fetch bracket data
        if (eventType === 'bracket' || eventType === 'hybrid') {
          const { data: roundsData } = await supabase
            .from('rounds')
            .select('*')
            .eq('event_id', eventId)
            .order('round_order')

          const { data: matchupsData } = await supabase
            .from('matchups')
            .select('*')
            .eq('event_id', eventId)

          const { data: teamsData } = await supabase
            .from('teams')
            .select('*')
            .eq('event_id', eventId)
            .order('seed')

          setRounds(roundsData || [])
          setMatchups(matchupsData || [])
          setTeams(teamsData || [])
        }

        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    loadPool()
  }, [poolId])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#dc2626' }}>
        Error: {error}
      </div>
    )
  }

  if (!pool || !event) {
    return (
      <div style={{ padding: 24 }}>
        Pool not found
      </div>
    )
  }

  // Check if pool is locked
  const isLocked = new Date(event.start_time) < new Date()

  if (isLocked) {
    return (
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: 24 
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{pool.name}</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>{event.name} {event.year}</p>
        
        <div style={{
          padding: 24,
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Picks are locked</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>
            This event has already started
          </p>
          <Link
            href={`/pool/${poolId}/standings`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            View Standings
          </Link>
        </div>
      </div>
    )
  }

  // Determine which form to show based on event type and reseeding
  const eventType = event.event_type
  const usesReseeding = event.uses_reseeding === true

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      padding: 24 
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{pool.name}</h1>
      <p style={{ color: '#666', marginBottom: 8 }}>{event.name} {event.year}</p>
      
      {/* Pool Notes (if set) */}
      {pool.notes && (
        <div style={{
          padding: 16,
          background: '#fef9c3',
          border: '1px solid #facc15',
          borderRadius: 8,
          marginBottom: 24,
          whiteSpace: 'pre-wrap'
        }}>
          📝 {pool.notes}
        </div>
      )}

      {/* Lock time */}
      <p style={{ 
        fontSize: 13, 
        color: '#666', 
        marginBottom: 24,
        padding: '8px 12px',
        background: '#f3f4f6',
        borderRadius: 6,
        display: 'inline-block'
      }}>
        ⏰ Picks lock: {new Date(event.start_time).toLocaleString()}
      </p>

      {/* Pick Form based on event type */}
      {eventType === 'pick_one' && (
        <PickSubmissionForm
          pool={{
            ...pool,
            event: {
              ...event,
              categories: categories
            }
          }}
        />
      )}

      {eventType === 'bracket' && !usesReseeding && (
        <BracketPickForm
          pool={pool}
          rounds={rounds}
          matchups={matchups}
          teams={teams}
        />
      )}

      {eventType === 'bracket' && usesReseeding && (
        <AdvancementPickForm
          pool={pool}
          rounds={rounds}
          teams={teams}
          matchups={matchups}
        />
      )}

      {eventType === 'hybrid' && !usesReseeding && (
        <>
          <BracketPickForm
            pool={pool}
            rounds={rounds}
            matchups={matchups}
            teams={teams}
          />
          <div style={{ marginTop: 32 }}>
            <PickSubmissionForm
              pool={{
                ...pool,
                event: {
                  ...event,
                  categories: categories
                }
              }}
            />
          </div>
        </>
      )}

      {eventType === 'hybrid' && usesReseeding && (
        <>
          <AdvancementPickForm
            pool={pool}
            rounds={rounds}
            teams={teams}
            matchups={matchups}
          />
          <div style={{ marginTop: 32 }}>
            <PickSubmissionForm
              pool={{
                ...pool,
                event: {
                  ...event,
                  categories: categories
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
