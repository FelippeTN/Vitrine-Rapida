import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'product' | 'collection'
  currentCount: number
  limit: number
  planName: string
}

export function UpgradeModal({
  isOpen,
  onClose,
  type,
  currentCount,
  limit,
  planName,
}: UpgradeModalProps) {
  const navigate = useNavigate()

  const typeLabel = type === 'product' ? 'produtos' : 'vitrines'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-[#25D366] px-6 py-8 text-center text-white">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Crown className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Limite atingido!</h2>
              <p className="text-purple-100">
                Você atingiu o limite de {typeLabel} do plano {planName}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Seus {typeLabel}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {currentCount}/{limit}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <p className="text-gray-600 text-center mb-6">
                Para adicionar mais {typeLabel}, faça upgrade do seu plano e desbloqueie novos limites.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    onClose()
                    navigate('/planos')
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Ver planos
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onClose}
                >
                  Continuar com plano atual
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
