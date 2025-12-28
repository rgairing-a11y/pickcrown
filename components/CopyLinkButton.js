'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url, label = 'Copy Link' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert('Failed to copy')
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 16px',
        background: copied ? '#22c55e' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background 0.2s'
      }}
    >
      {copied ? '✓ Copied!' : '📋 ' + label}
    </button>
  )
}