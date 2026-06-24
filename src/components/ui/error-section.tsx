import { AlertCircle, RefreshCcw } from 'lucide-react'

interface ErrorSectionProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorSection({ message = 'Failed to load data', onRetry, className = '' }: ErrorSectionProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-4 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Something went wrong</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 mt-4 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  )
}
