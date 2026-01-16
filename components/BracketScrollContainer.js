'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * BracketScrollContainer - Horizontal scroll container with visual hints
 * 
 * Provides:
 * - Fade gradients showing more content available
 * - Scroll hint indicator on mobile
 * - Touch-friendly scrolling
 * - Snap points for rounds (optional)
 */
export default function BracketScrollContainer({
  children,
  showScrollHint = true,
  enableSnap = false,
  minWidth = 800
}) {
  const containerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [showHint, setShowHint] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Check scroll position and update indicators
  const updateScrollState = () => {
    const container = containerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }

  // Hide hint after first interaction
  const handleScroll = () => {
    if (!hasInteracted) {
      setHasInteracted(true)
      setTimeout(() => setShowHint(false), 500)
    }
    updateScrollState()
  }

  // Initial check
  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [])

  // Check if content needs scrolling
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const needsScroll = container.scrollWidth > container.clientWidth
      setShowHint(needsScroll && showScrollHint)
      updateScrollState()
    }
  }, [children, showScrollHint])

  return (
    <div style={{ position: 'relative', margin: '0 calc(-1 * var(--spacing-4))' }}>
      {/* Left fade/arrow indicator */}
      {canScrollLeft && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: 'linear-gradient(90deg, var(--color-white) 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'var(--spacing-2)'
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-white)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '18px',
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
          onClick={() => {
            containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
          }}
          >
            ‹
          </div>
        </div>
      )}

      {/* Right fade/arrow indicator */}
      {canScrollRight && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: 'linear-gradient(270deg, var(--color-white) 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 'var(--spacing-2)'
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-white)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '18px',
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
          onClick={() => {
            containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
          }}
          >
            ›
          </div>
        </div>
      )}

      {/* Scroll hint overlay (mobile) */}
      {showHint && !hasInteracted && (
        <div
          className="hide-desktop"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: 'var(--spacing-3) var(--spacing-5)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            pointerEvents: 'none',
            animation: 'fadeInOut 3s ease-in-out infinite'
          }}
        >
          <span style={{ 
            animation: 'swipeHint 1.5s ease-in-out infinite',
            display: 'inline-block'
          }}>
            👆
          </span>
          Swipe to see more
        </div>
      )}

      {/* Scrollable content container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: enableSnap ? 'x mandatory' : 'none',
          padding: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-6)' // Extra padding for scrollbar
        }}
      >
        <div style={{
          minWidth: minWidth,
          display: 'inline-block'
        }}>
          {children}
        </div>
      </div>

      {/* Scroll progress indicator (mobile) */}
      <div
        className="hide-desktop"
        style={{
          height: 3,
          background: 'var(--color-border-light)',
          borderRadius: 'var(--radius-full)',
          margin: '0 var(--spacing-4)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            width: containerRef.current 
              ? `${(containerRef.current.scrollLeft / (containerRef.current.scrollWidth - containerRef.current.clientWidth)) * 100}%`
              : '0%',
            transition: 'width 100ms ease'
          }}
        />
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes swipeHint {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        
        /* Custom scrollbar styling */
        .bracket-scroll::-webkit-scrollbar {
          height: 6px;
        }
        
        .bracket-scroll::-webkit-scrollbar-track {
          background: var(--color-border-light);
          border-radius: 3px;
        }
        
        .bracket-scroll::-webkit-scrollbar-thumb {
          background: var(--color-text-muted);
          border-radius: 3px;
        }
        
        .bracket-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary);
        }
      `}</style>
    </div>
  )
}

/**
 * BracketRound - Wrapper for individual bracket rounds with snap support
 */
export function BracketRound({ children, roundName }) {
  return (
    <div style={{
      scrollSnapAlign: 'start',
      display: 'inline-flex',
      flexDirection: 'column',
      minWidth: 180,
      marginRight: 'var(--spacing-4)'
    }}>
      {roundName && (
        <div style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-3)',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-white)',
          padding: 'var(--spacing-2) 0',
          zIndex: 5
        }}>
          {roundName}
        </div>
      )}
      {children}
    </div>
  )
}
