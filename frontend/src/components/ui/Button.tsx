import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#075E54] text-white hover:bg-[#064e46] shadow-md shadow-[#075E54]/20 hover:shadow-lg hover:shadow-[#075E54]/30 border border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100/50 hover:text-gray-900',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-5 py-2.5 text-sm h-10',
  lg: 'px-8 py-3.5 text-base h-12',
  icon: 'h-10 w-10 p-0 flex items-center justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      children,
      onClick,
      type,
      ...rest
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#075E54] focus:ring-offset-2'

    // Extract only safe HTML attributes to avoid conflicts
    const safeProps = {
      id: rest.id,
      name: rest.name,
      form: rest.form,
      formAction: rest.formAction,
      'aria-label': rest['aria-label'],
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))}
        onClick={onClick}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...safeProps}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.svg 
              className="h-4 w-4" 
              viewBox="0 0 24 24" 
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </motion.svg>
            Carregando...
          </span>
        ) : children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
