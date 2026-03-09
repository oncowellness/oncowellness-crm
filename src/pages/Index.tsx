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
import LoginPage from '@/components/auth/LoginPage'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuth } from '@/contexts/AuthContext'
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
      return (
        <RoleGuard allowedRoles={['admin', 'director']}>
          <IncentivesPanel />
        </RoleGuard>
      )
    default:
      return <MainDashboard />
  }
}

const Index = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

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
