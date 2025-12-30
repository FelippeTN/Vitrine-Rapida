import { type HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered'
  animate?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', animate = true, className = '', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white shadow-sm border border-gray-200',
      bordered: 'bg-white border-2 border-gray-200 hover:border-blue-300',
    }

    const cardContent = (
      <div
        ref={ref}
        className={`rounded-xl p-5 transition-colors ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )

    if (!animate) return cardContent

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      >
        {cardContent}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
