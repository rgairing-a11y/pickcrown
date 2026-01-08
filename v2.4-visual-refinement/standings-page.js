export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import StandingsTable from '../../../../components/StandingsTable'
import EmptyState from '../../../../components/EmptyState'
import ScenarioSimulator from '../../../../components/ScenarioSimulator'
import MyPicksButton from '../../../../components/MyPicksButton'

// Use service role key for full data access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function StandingsPage({ params }) {
  const { poolId } = await params

  const { data: pool } = await supabase
    .from('pools')
    .select('*, event:events(id, name, year, start_time, status, season_id, event_type, season:seasons(id, name))')
    .eq('id', poolId)
    .single()

  if (!pool) {
    return (
      <div style={{ maxWidth: 500, margin: '48px auto', padding: 'var(--spacing-4)' }}>
        <EmptyState
          variant="not-found"
          title="Pool not found"
          description="This pool doesn't exist or you don't have access"
          actionLabel="Go Home"
          actionHref="/"
        />
      </div>
    )
  }

  const { data: standings } = await supabase
    .rpc('calculate_standings', { p_pool_id: poolId })

  const season = pool.event?.season
  const isLocked = new Date(pool.event.start_time) < new Date()
  const isCompleted = pool.event.status === 'completed'
  const eventType = pool.event.event_type

  // Get popular picks data (only if locked)
  let popularPicks = []
  if (isLocked && eventType !== 'bracket') {
    const { data: categories } = await supabase
      .from('categories')
      .select(`id, name, order_index, options:category_options(id, name, is_correct)`)
      .eq('event_id', pool.event.id)
      .order('order_index')

    const { data: entries } = await supabase
      .from('pool_entries')
      .select('id')
      .eq('pool_id', poolId)

    const entryIds = entries?.map(e => e.id) || []

    if (entryIds.length > 0) {
      const { data: picks } = await supabase
        .from('category_picks')
        .select('category_id, option_id')
        .in('pool_entry_id', entryIds)

      popularPicks = (categories || []).map(category => {
        const categoryPicks = picks?.filter(p => p.category_id === category.id) || []
        const totalPicks = categoryPicks.length

        const optionCounts = category.options.map(option => {
          const count = categoryPicks.filter(p => p.option_id === option.id).length
          const percentage = totalPicks > 0 ? Math.round((count / totalPicks) * 100) : 0
          return { id: option.id, name: option.name, count, percentage, isCorrect: option.is_correct }
        }).sort((a, b) => b.percentage - a.percentage)

        return { id: category.id, name: category.name, totalPicks, options: optionCounts }
      })
    }
  }

  // Determine event status for display
  const eventStatus = isCompleted ? 'completed' : isLocked ? 'in_progress' : 'upcoming'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--spacing-4)' }}>
      {/* Header Card */}
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-6)',
        marginBottom: 'var(--spacing-6)',
        border: '1px solid var(--color-border-light)'
      }}>
        {/* Breadcrumb */}
        <nav style={{
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--spacing-4)'
        }}>
          <Link href={`/pool/${poolId}`} style={{
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)'
          }}>
            ← Back to Pool
          </Link>
        </nav>

        {/* Title Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-4)'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-text)',
              margin: 0,
              lineHeight: 'var(--line-height-tight)'
            }}>
              {pool.name}
            </h1>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-2)',
              marginBottom: 0
            }}>
              {pool.event.name} ({pool.event.year})
            </p>
          </div>

          {/* Status Badge */}
          <span style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-medium)',
            background: isCompleted 
              ? 'var(--color-success-light)' 
              : isLocked 
                ? 'var(--color-warning-light)' 
                : 'var(--color-primary-light)',
            color: isCompleted 
              ? 'var(--color-success-dark)' 
              : isLocked 
                ? 'var(--color-warning-dark)' 
                : 'var(--color-primary-dark)'
          }}>
            {isCompleted ? '✓ Final' : isLocked ? '● Live' : '○ Upcoming'}
          </span>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-6)',
          paddingTop: 'var(--spacing-4)',
          borderTop: '1px solid var(--color-border-light)'
        }}>
          <div>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-text)'
            }}>
              {standings?.length || 0}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)'
            }}>
              {standings?.length === 1 ? 'Entry' : 'Entries'}
            </div>
          </div>
          
          {standings?.[0]?.total_points > 0 && (
            <div>
              <div style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--color-gold)'
              }}>
                {standings[0].total_points}
              </div>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)'
              }}>
                Top Score
              </div>
            </div>
          )}
        </div>

        {/* Season Link */}
        {season && (
          <div style={{
            marginTop: 'var(--spacing-4)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)'
          }}>
            Part of{' '}
            <Link href={`/season/${season.id}/standings`} style={{
              fontWeight: 'var(--font-semibold)'
            }}>
              {season.name} →
            </Link>
          </div>
        )}
      </div>

      {/* My Picks Button */}
      {isLocked && standings && standings.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <MyPicksButton 
            poolId={poolId}
            standings={standings}
          />
        </div>
      )}

      {/* Standings Section */}
      <section style={{ marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-semibold)',
          marginBottom: 'var(--spacing-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)'
        }}>
          🏆 Standings
        </h2>

        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          border: '1px solid var(--color-border-light)'
        }}>
          {!standings || standings.length === 0 ? (
            <EmptyState
              variant="trophy"
              title="No standings yet"
              description={isLocked 
                ? "Results will appear as they're entered" 
                : "Waiting for picks to be submitted"
              }
              compact
            />
          ) : (
            <StandingsTable
              standings={standings}
              showPoints={true}
              eventStatus={eventStatus}
            />
          )}
        </div>
      </section>

      {/* Scenario Simulator (if applicable) */}
      {isLocked && !isCompleted && eventType === 'pick_one' && standings?.length > 0 && (
        <section style={{ marginBottom: 'var(--spacing-8)' }}>
          <ScenarioSimulator
            poolId={poolId}
            standings={standings}
          />
        </section>
      )}

      {/* Popular Picks Section */}
      {isLocked && popularPicks.length > 0 && (
        <section>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            📊 Popular Picks
          </h2>

          <div style={{
            display: 'grid',
            gap: 'var(--spacing-4)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {popularPicks.map(category => (
              <div
                key={category.id}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-5)',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <h3 style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--spacing-4)',
                  color: 'var(--color-text)'
                }}>
                  {category.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  {category.options.slice(0, 4).map(option => (
                    <div key={option.id}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-1)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <span style={{
                          fontWeight: option.isCorrect ? 'var(--font-semibold)' : 'var(--font-normal)',
                          color: option.isCorrect ? 'var(--color-success)' : 'var(--color-text)'
                        }}>
                          {option.name}
                          {option.isCorrect && ' ✓'}
                        </span>
                        <span style={{
                          color: 'var(--color-text-muted)',
                          fontWeight: option.percentage >= 50 ? 'var(--font-semibold)' : 'var(--font-normal)'
                        }}>
                          {option.percentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{
                        height: 6,
                        background: 'var(--color-border-light)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${option.percentage}%`,
                          background: option.isCorrect
                            ? 'var(--color-success)'
                            : option.percentage >= 50
                              ? 'var(--color-primary)'
                              : 'var(--color-text-muted)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 300ms ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 'var(--spacing-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)'
                }}>
                  {category.totalPicks} {category.totalPicks === 1 ? 'pick' : 'picks'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
