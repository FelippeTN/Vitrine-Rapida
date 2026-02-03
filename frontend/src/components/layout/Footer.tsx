export interface FooterProps {
  text?: string
}

export function Footer({ text = '© 2025 Vitrine Rápida' }: FooterProps) {
  return (
    <footer className="py-6 text-center text-sm text-gray-500">
      {text}
    </footer>
  )
}
