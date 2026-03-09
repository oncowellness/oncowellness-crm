import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  maxDisplay?: number
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (opt: string) => {
    onChange(
      value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt],
    )
  }

  const displayText =
    value.length === 0
      ? placeholder
      : value.length <= maxDisplay
        ? value.join(', ')
        : `${value.slice(0, maxDisplay).join(', ')} +${value.length - maxDisplay}`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full text-left text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center justify-between gap-1',
          value.length === 0 && 'text-slate-400',
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {value.length > 0 && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange([]) }}
          className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 text-slate-400"
        >
          <X size={12} />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.map(opt => {
            const selected = value.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  'w-full text-left text-sm px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50',
                  selected && 'bg-teal-50 text-teal-700',
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 shrink-0 rounded border flex items-center justify-center',
                    selected
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300',
                  )}
                >
                  {selected && <Check size={10} />}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
