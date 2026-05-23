import { supabaseAdmin } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function GET() {
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data, error } = await supabaseAdmin
    .from('finance_entries')
    .select('entry_date, amount, type')
    .gte('entry_date', monthStart)
    .lte('entry_date', monthEnd)

  if (error) return Response.json({ income: 0, expenses: 0, net: 0, savings_rate: 0, daily: [] })

  const entries = data ?? []
  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const expenses = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  const net = income - expenses
  const savings_rate = income > 0 ? Math.round((net / income) * 100) : 0

  const days = eachDayOfInterval({ start: startOfMonth(now), end: now })
  const daily = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayEntries = entries.filter((e) => e.entry_date === dateStr)
    const dayIncome = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
    const dayExp = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
    return { date: dateStr, net: dayIncome - dayExp }
  })

  return Response.json({ income, expenses, net, savings_rate, daily })
}
