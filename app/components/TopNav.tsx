'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'HOME', href: '/' },
  { label: 'CRM', href: '/crm' },
  { label: 'FINANCE', href: '/finance' },
  { label: 'REVIEW', href: '/review' },
]

export default function TopNav() {
  const pathname = usePathname()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#000000',
      borderBottom: '1px solid #1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '48px',
    }}>
      {/* Wordmark */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: '#ffffff',
        textTransform: 'uppercase',
      }}>
        KYLEROPS
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {tabs.map(tab => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: active ? '#000000' : '#666666',
                background: active ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}>
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Live clock */}
      <div style={{
        fontSize: '11px',
        fontWeight: 500,
        color: '#444444',
        fontVariantNumeric: 'tabular-nums',
        minWidth: '80px',
        textAlign: 'right',
      }}>
        {time}
      </div>
    </nav>
  )
}
