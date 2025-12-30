import { Button } from '../ui'
import { Store } from 'lucide-react'

export interface HeaderProps {
  title: string
  subtitle?: string
  showLogo?: boolean
  backLabel?: string
  onBack?: () => void
  onLogout?: () => void
}

export function Header({
  title,
  subtitle,
  showLogo = true,
  backLabel,
  onBack,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← {backLabel || 'Voltar'}
            </Button>
          )}

          {showLogo && !onBack && (
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {onLogout && (
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sair
          </Button>
        )}
      </div>
    </header>
  )
}
