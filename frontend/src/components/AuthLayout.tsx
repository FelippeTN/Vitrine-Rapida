import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Store, Check } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col p-8 bg-white">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200/50">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 leading-tight">
                Vitrine Digital
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Catálogo Online
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {children}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-blue-600 hover:underline">Termos de Serviço</a>
        </p>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 bg-blue-600 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4">
            Sua vitrine digital profissional
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            Crie catálogos incríveis e compartilhe com seus clientes
          </p>

          <div className="space-y-4">
            {[
              'Fácil de usar',
              'Compartilhamento rápido',
              'Visual profissional',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
