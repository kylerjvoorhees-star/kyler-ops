import { Suspense } from 'react'
import OperatorCard from './components/OperatorCard'
import SessionCard from './components/SessionCard'
import CalendarCard from './components/CalendarCard'
import HabitsCard from './components/HabitsCard'
import CrmCard from './components/CrmCard'
import NutritionCard from './components/NutritionCard'
import FinanceCard from './components/FinanceCard'

function CardSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`rounded-2xl bg-white/5 border border-white/10 animate-pulse ${tall ? 'h-48' : 'h-72'}`}
    />
  )
}

export default function Dashboard() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <header className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-white/80">
            KYLER<span className="text-violet-400">OPS</span>
          </h1>
          <span className="text-xs text-white/30 font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </header>

        {/* Row 1: Operator / Session / Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <OperatorCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <SessionCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <CalendarCard />
          </Suspense>
        </div>

        {/* Row 2: Habits / CRM / Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <HabitsCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <CrmCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <NutritionCard />
          </Suspense>
        </div>

        {/* Row 3: Finance full-width */}
        <div className="grid grid-cols-1">
          <Suspense fallback={<CardSkeleton tall />}>
            <FinanceCard />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
