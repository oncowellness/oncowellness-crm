import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
