'use client'

import { useEffect } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  dotColor?: string
  children: React.ReactNode
}

export default function Drawer({ open, onClose, title, dotColor = '#378ADD', children }: DrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      window.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(1,5,9,0.85)' }}
      />
      {/* Panel */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '520px', maxWidth: '95vw',
        background: '#071E30',
        borderLeft: '0.5px solid #0A2840',
        overflowY: 'auto',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: dotColor }} />
            <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
