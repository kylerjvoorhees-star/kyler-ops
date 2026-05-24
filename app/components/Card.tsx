import React from 'react'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  padding?: string
}

export default function Card({ children, style, padding = '20px' }: CardProps) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: '3px solid #C9933A',
      borderBottom: '3px solid #C9933A',
      borderRadius: '12px',
      padding,
      position: 'relative',
      ...style,
    }}>
      {children}
    </div>
  )
}
