'use client'

import { useState, useEffect } from 'react'

/**
 * UserAvatar - Displays user avatar with emoji and color
 * 
 * @param {string} email - User's email (for fetching profile)
 * @param {string} emoji - Direct emoji override
 * @param {string} color - Direct color override
 * @param {string} name - Display name (for tooltip)
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} showName - Show name below avatar
 * @param {boolean} showBadge - Show commissioner badge
 * @param {boolean} clickable - Make avatar clickable (for edit)
 * @param {function} onClick - Click handler
 */
export default function UserAvatar({
  email,
  emoji,
  color,
  name,
  size = 'md',
  showName = false,
  showBadge = false,
  isCommissioner = false,
  clickable = false,
  onClick
}) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  // Size mappings
  const sizes = {
    xs: { container: 24, emoji: '0.75rem', name: '0.625rem' },
    sm: { container: 32, emoji: '1rem', name: '0.75rem' },
    md: { container: 40, emoji: '1.25rem', name: '0.8125rem' },
    lg: { container: 56, emoji: '1.75rem', name: '0.875rem' },
    xl: { container: 80, emoji: '2.5rem', name: '1rem' }
  }

  const currentSize = sizes[size] || sizes.md

  // Fetch profile if email provided and no direct emoji/color
  useEffect(() => {
    if (email && !emoji && !color) {
      fetchProfile()
    }
  }, [email, emoji, color])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch(`/api/profiles?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Determine what to display
  const displayEmoji = emoji || profile?.avatar_emoji || '👤'
  const displayColor = color || profile?.avatar_color || '#3b82f6'
  const displayName = name || profile?.display_name || email?.split('@')[0] || 'User'
  const displayIsCommissioner = isCommissioner || profile?.is_commissioner || false

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        cursor: clickable ? 'pointer' : 'default'
      }}
    >
      {/* Avatar Circle */}
      <div style={{
        position: 'relative',
        width: currentSize.container,
        height: currentSize.container,
        borderRadius: '50%',
        background: displayColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: currentSize.emoji,
        transition: 'transform var(--transition-fast)',
        boxShadow: clickable ? 'var(--shadow-sm)' : 'none',
        ...(clickable && {
          ':hover': {
            transform: 'scale(1.05)'
          }
        })
      }}>
        {loading ? (
          <span style={{ opacity: 0.5 }}>...</span>
        ) : (
          displayEmoji
        )}

        {/* Commissioner Badge */}
        {showBadge && displayIsCommissioner && (
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: Math.max(16, currentSize.container * 0.4),
            height: Math.max(16, currentSize.container * 0.4),
            borderRadius: '50%',
            background: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(10, currentSize.container * 0.25),
            border: '2px solid white'
          }}>
            👑
          </div>
        )}
      </div>

      {/* Name */}
      {showName && (
        <span style={{
          fontSize: currentSize.name,
          fontWeight: 'var(--font-medium)',
          color: 'var(--color-text)',
          maxWidth: currentSize.container * 2.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {displayName}
        </span>
      )}
    </div>
  )
}

/**
 * AvatarGroup - Display multiple avatars in a row with overlap
 */
export function AvatarGroup({
  users = [],
  max = 5,
  size = 'sm',
  showCount = true
}) {
  const displayUsers = users.slice(0, max)
  const extraCount = users.length - max

  const sizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56
  }

  const containerSize = sizes[size] || sizes.sm
  const overlap = containerSize * 0.3

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center'
    }}>
      {displayUsers.map((user, idx) => (
        <div
          key={user.email || idx}
          style={{
            marginLeft: idx > 0 ? -overlap : 0,
            zIndex: displayUsers.length - idx,
            border: '2px solid white',
            borderRadius: '50%'
          }}
        >
          <UserAvatar
            email={user.email}
            emoji={user.avatar_emoji}
            color={user.avatar_color}
            size={size}
          />
        </div>
      ))}

      {showCount && extraCount > 0 && (
        <div style={{
          marginLeft: -overlap,
          width: containerSize,
          height: containerSize,
          borderRadius: '50%',
          background: 'var(--color-background-alt)',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: containerSize * 0.35,
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-muted)'
        }}>
          +{extraCount}
        </div>
      )}
    </div>
  )
}

/**
 * AvatarSelector - Grid of avatars for selection
 */
export function AvatarSelector({
  selected,
  onSelect,
  options = []
}) {
  const defaultOptions = [
    { emoji: '👑', label: 'Crown', color: '#f59e0b' },
    { emoji: '🏆', label: 'Trophy', color: '#eab308' },
    { emoji: '⚡', label: 'Lightning', color: '#8b5cf6' },
    { emoji: '🎯', label: 'Bullseye', color: '#ef4444' },
    { emoji: '🦁', label: 'Lion', color: '#f97316' },
    { emoji: '🐻', label: 'Bear', color: '#78716c' },
    { emoji: '🦅', label: 'Eagle', color: '#0ea5e9' },
    { emoji: '🐺', label: 'Wolf', color: '#6b7280' },
    { emoji: '🚀', label: 'Rocket', color: '#3b82f6' },
    { emoji: '💎', label: 'Diamond', color: '#06b6d4' },
    { emoji: '🔥', label: 'Fire', color: '#f97316' },
    { emoji: '⭐', label: 'Star', color: '#fbbf24' },
    { emoji: '🏈', label: 'Football', color: '#854d0e' },
    { emoji: '⚽', label: 'Soccer', color: '#16a34a' },
    { emoji: '🏀', label: 'Basketball', color: '#ea580c' },
    { emoji: '🎬', label: 'Movies', color: '#1f2937' }
  ]

  const displayOptions = options.length > 0 ? options : defaultOptions

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--spacing-3)'
    }}>
      {displayOptions.map((avatar) => (
        <button
          key={avatar.emoji}
          onClick={() => onSelect(avatar)}
          type="button"
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 'var(--radius-lg)',
            background: avatar.color,
            border: selected?.emoji === avatar.emoji 
              ? '3px solid var(--color-primary)' 
              : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            transform: selected?.emoji === avatar.emoji ? 'scale(1.1)' : 'scale(1)'
          }}
          title={avatar.label}
        >
          {avatar.emoji}
        </button>
      ))}
    </div>
  )
}
