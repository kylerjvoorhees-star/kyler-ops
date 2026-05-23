import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET() {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data, error } = await supabaseAdmin
    .from('nutrition_logs')
    .select('calories, protein_g, carbs_g, fat_g')
    .eq('log_date', today)

  if (error) return Response.json({ totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } })

  const totals = (data ?? []).reduce(
    (acc, row) => ({
      calories: acc.calories + (row.calories ?? 0),
      protein: acc.protein + (row.protein_g ?? 0),
      carbs: acc.carbs + (row.carbs_g ?? 0),
      fat: acc.fat + (row.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return Response.json({ totals })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { meal, description, calories, protein_g, carbs_g, fat_g } = body

  const { data, error } = await supabaseAdmin
    .from('nutrition_logs')
    .insert({ meal, description, calories, protein_g, carbs_g, fat_g })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entry: data })
}
