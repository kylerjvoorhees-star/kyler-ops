import OperatorCard from './components/OperatorCard'
import SessionCard from './components/SessionCard'
import CalendarCard from './components/CalendarCard'
import HabitsCard from './components/HabitsCard'
import NutritionCard from './components/NutritionCard'
import TasksCard from './components/TasksCard'
import JournalCard from './components/JournalCard'
import GoalsCard from './components/GoalsCard'
import KeyBlockersCard from './components/KeyBlockersCard'

export default function Dashboard() {
  return (
    <div className="home-grid">
      {/* LEFT COLUMN — 320px */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <OperatorCard />
        <HabitsCard />
        <NutritionCard />
      </div>

      {/* CENTER COLUMN — flex */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <SessionCard />
        <TasksCard />
        <JournalCard />
        <GoalsCard />
      </div>

      {/* RIGHT COLUMN — 280px */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <CalendarCard />
        <KeyBlockersCard />
      </div>
    </div>
  )
}
