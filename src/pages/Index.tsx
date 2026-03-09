import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MainDashboard } from '@/components/dashboard/MainDashboard'
import { PatientList } from '@/components/patients/PatientList'
import { PatientDetail } from '@/components/patients/PatientDetail'
import { PhysioModule } from '@/components/modules/PhysioModule'
import { PsychoModule } from '@/components/modules/PsychoModule'
import { EmpowermentModule } from '@/components/modules/EmpowermentModule'
import { ClinicalDashboard } from '@/components/dashboard/ClinicalDashboard'
import { BundleManager } from '@/components/bundles/BundleManager'
import { CalendarView } from '@/components/calendar/CalendarView'
import { ConfigPrograms } from '@/components/config/ConfigPrograms'
import { ConfigBundles } from '@/components/config/ConfigBundles'
import IncentivesPanel from '@/components/incentives/IncentivesPanel'
import { useStore } from '@/store/useStore'

function ViewRouter() {
  const { view } = useStore()

  switch (view) {
    case 'dashboard':
      return <MainDashboard />
    case 'patients':
      return <PatientList />
    case 'patient-detail':
      return <PatientDetail />
    case 'physio':
      return <PhysioModule />
    case 'psycho':
      return <PsychoModule />
    case 'empowerment':
      return <EmpowermentModule />
    case 'clinical-dashboard':
      return <ClinicalDashboard />
    case 'bundles':
      return <BundleManager />
    case 'calendar':
      return <CalendarView />
    case 'config-programs':
      return <ConfigPrograms />
    case 'config-bundles':
      return <ConfigBundles />
    case 'incentives':
      return <IncentivesPanel />
    default:
      return <MainDashboard />
  }
}

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ViewRouter />
        </main>
      </div>
    </div>
  )
}

export default Index
