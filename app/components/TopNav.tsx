'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mainTabs = [
  { label: 'HOME', href: '/' },
  { label: 'CRM', href: '/crm' },
  { label: 'FINANCE', href: '/finance' },
  { label: 'REVIEW', href: '/review' },
]

const detailTabs = [
  { label: 'JOURNAL', href: '/journal' },
  { label: 'TASKS', href: '/tasks' },
  { label: 'HABITS', href: '/habits' },
  { label: 'NUTRITION', href: '/nutrition' },
  { label: 'CALENDAR', href: '/calendar' },
  { label: 'BLOCKERS', href: '/blockers' },
]

export default function TopNav() {
  const pathname = usePathname()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setTime(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const isDetailPage = detailTabs.some(t => pathname.startsWith(t.href))

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#000000',
      borderBottom: '1px solid #1a1a1a',
    }}>
      {/* Main row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
      }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#ffffff',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
            KYLEROPS
          </div>
        </Link>

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {mainTabs.map(tab => {
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
      </div>

      {/* Detail sub-nav */}
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '0 24px',
        borderTop: '1px solid #111',
        overflowX: 'auto',
      }}>
        {detailTabs.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                padding: '6px 14px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: active ? '#C9933A' : '#333333',
                borderBottom: active ? '2px solid #C9933A' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
