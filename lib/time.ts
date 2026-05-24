export function getMSTGreeting(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getMSTTime(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}
