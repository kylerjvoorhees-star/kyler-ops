// KylerOps V2 Design System — Single source of truth for all colors/styles

export const D = {
  // Backgrounds
  bgPage:    '#010509',
  bgCard:    '#071E30',
  bgDivider: '#0A2840',
  bgInput:   '#040F1C',
  bgBorder:  '#0A1825',

  // Text
  textLabel:    '#378ADD',  // section labels, dot indicators
  textBody:     '#7AABCC',  // readable body copy
  textDim:      '#1E4060',  // metadata, timestamps, placeholders
  textInactive: '#0E2030',  // uncompleted, disabled

  // Accents
  teal:        '#5DCAA5',
  btnGreenBg:  '#0F6E56',
  btnGreenTxt: '#9FE1CB',
  blueAccent:  '#185FA5',
  blueMid:     '#0C2E50',
  highlight:   '#378ADD',

  // Priority colors (tasks)
  urgent:  '#D85A30',
  high:    '#EF9F27',
  normal:  '#378ADD',
  low:     '#1E4060',
} as const

// Dot colors per module
export const DOT: Record<string, string> = {
  operator:      '#378ADD',
  session:       '#1D9E75',
  calendar:      '#378ADD',
  habits:        '#1D9E75',
  crm:           '#378ADD',
  nutrition:     '#5DCAA5',
  finance:       '#1D9E75',
  tasks:         '#378ADD',
  journal:       '#5DCAA5',
  goals:         '#1D9E75',
  weeklyReview:  '#378ADD',
}

// Shared inline style factories
export const S = {
  card: {
    background: '#071E30',
    borderRadius: '8px',
    padding: '18px',
    border: '0.5px solid #0A2840',
  } as React.CSSProperties,

  divider: {
    height: '0.5px',
    background: '#0A2840',
    margin: '12px 0',
  } as React.CSSProperties,

  input: {
    width: '100%',
    background: '#040F1C',
    border: '0.5px solid #0A2840',
    borderRadius: '5px',
    padding: '7px 10px',
    fontSize: '11px',
    color: '#7AABCC',
    outline: 'none',
  } as React.CSSProperties,

  btnPrimary: {
    background: '#0F6E56',
    borderRadius: '5px',
    padding: '6px 14px',
    fontSize: '11px',
    color: '#9FE1CB',
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,

  btnSecondary: {
    background: 'transparent',
    border: '0.5px solid #0A2840',
    borderRadius: '5px',
    padding: '6px 14px',
    fontSize: '11px',
    color: '#1E4060',
    cursor: 'pointer',
  } as React.CSSProperties,

  btnAccent: {
    background: '#0C2E50',
    border: '0.5px solid #185FA5',
    borderRadius: '5px',
    padding: '6px 14px',
    fontSize: '11px',
    color: '#378ADD',
    cursor: 'pointer',
  } as React.CSSProperties,

  label: {
    fontSize: '9px',
    letterSpacing: '0.18em',
    color: '#378ADD',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
}
