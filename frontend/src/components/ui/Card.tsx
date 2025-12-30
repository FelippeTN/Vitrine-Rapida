import { type HTMLAttributes, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white shadow-sm border border-gray-200',
      bordered: 'bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors',
    }

    return (
      <div
        ref={ref}
        className={`rounded-xl p-5 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
