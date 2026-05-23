'use client'

import { useEffect } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  dotColor?: string
  children: React.ReactNode
}

export default function Drawer({ open, onClose, title, dotColor = '#ffffff', children }: DrawerProps) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }}
      />
      {/* Panel */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '520px', maxWidth: '95vw',
        background: '#111111',
        borderLeft: '1px solid #1a1a1a',
        overflowY: 'auto',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '2px 6px' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
