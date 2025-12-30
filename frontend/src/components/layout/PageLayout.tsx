import { type ReactNode } from 'react'
import { Header, type HeaderProps } from './Header'
import { Footer } from './Footer'

export interface PageLayoutProps extends HeaderProps {
  children: ReactNode
  footerText?: string
}

export function PageLayout({
  children,
  footerText,
  ...headerProps
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header {...headerProps} />
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">{children}</main>
      <Footer text={footerText} />
    </div>
  )
}
