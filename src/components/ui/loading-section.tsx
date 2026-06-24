import { Loader2 } from 'lucide-react'

interface LoadingSectionProps {
  text?: string
  className?: string
}

export function LoadingSection({ text = 'Loading...', className = '' }: LoadingSectionProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-[var(--text-muted)] animate-pulse">
        <span className="text-sm font-medium tracking-widest uppercase">{text}</span>
      </div>
    </div>
  )
}
