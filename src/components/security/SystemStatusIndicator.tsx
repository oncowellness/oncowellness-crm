import { useEmergencyLock } from '@/hooks/useEmergencyLock'

export function SystemStatusIndicator() {
  const { isLocked, loading } = useEmergencyLock()

  if (loading) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
      <span className="text-[10px] text-slate-500 font-medium">
        {isLocked ? 'LOCKDOWN' : 'Seguro'}
      </span>
    </div>
  )
}
