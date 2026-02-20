import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'

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
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-[#075E54]/20">
              <img src={logoSvg} alt="Vitrine Rápida Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 leading-tight">
                Vitrine Digital
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Catálogo Digital
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {children}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-[#075E54] hover:underline">Termos de Serviço</a>
        </p>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 bg-[#075E54] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#075E54] to-[#064e46]" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4">
            Sua vitrine digital profissional
          </h1>
          <p className="text-[#25D366]/80 text-lg mb-10">
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
