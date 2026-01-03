import { type ReactNode } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export interface PageLayoutProps {
  children: ReactNode
  isAuthenticated?: boolean
  onLogout?: () => void
  footerText?: string
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export function PageLayout({
  children,
  isAuthenticated,
  onLogout,
  footerText,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <AnimatePresence mode="wait">
        <motion.main
          className="flex-1 max-w-6xl w-full mx-auto p-6"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer text={footerText} />
    </div>
  )
}

// Staggered container for lists - properly typed
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
}
