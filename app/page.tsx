import OperatorCard from './components/OperatorCard'
import SessionCard from './components/SessionCard'
import CalendarCard from './components/CalendarCard'
import HabitsCard from './components/HabitsCard'
import CrmCard from './components/CrmCard'
import NutritionCard from './components/NutritionCard'
import TasksCard from './components/TasksCard'
import JournalCard from './components/JournalCard'
import GoalsCard from './components/GoalsCard'
import FinanceCard from './components/FinanceCard'
import WeeklyReviewCard from './components/WeeklyReviewCard'

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div style={{
      background: '#010509',
      minHeight: '100vh',
      padding: '20px',
      border: '0.5px solid #0A1825',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#378ADD' }} />
          <span style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#378ADD', textTransform: 'uppercase', fontWeight: 500 }}>
            KylerOps
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#1E4060' }}>{today}</span>
      </div>

      {/* Row 1: Operator | Session | Calendar */}
      <div className="dashboard-grid">
        <OperatorCard />
        <SessionCard />
        <CalendarCard />
      </div>

      {/* Row 2: Habits | CRM | Nutrition */}
      <div className="dashboard-grid" style={{ marginTop: '14px' }}>
        <HabitsCard />
        <CrmCard />
        <NutritionCard />
      </div>

      {/* Row 3: Tasks | Journal | Goals */}
      <div className="dashboard-grid" style={{ marginTop: '14px' }}>
        <TasksCard />
        <JournalCard />
        <GoalsCard />
      </div>

      {/* Row 4: Finance Pulse (full width) */}
      <div style={{ marginTop: '14px' }}>
        <FinanceCard />
      </div>

      {/* Row 5: Weekly Review (full width) */}
      <div style={{ marginTop: '14px' }}>
        <WeeklyReviewCard />
      </div>
    </div>
  )
}
