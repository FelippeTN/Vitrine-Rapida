import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      <div className="flex-1 flex flex-col p-8 bg-white max-w-50vh">
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800"> 
            {/* TODO: Adicionar logo aqui ! */}
            <span>Catalogo</span>
          </div>
          <a href="#" className="text-gray-500 text-sm font-medium hover:text-gray-800 transition-colors">← Voltar</a>
        </div>
        
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
          {children}
        </div>

        <div className="mt-auto text-center text-xs text-gray-500 pt-8">
          Ao continuar, você concorda com nossos <a href="#" className="text-orange-500 underline hover:text-orange-600 transition-colors">Termos de Serviço</a>
        </div>
      </div>

      <div className="flex-1 bg-orange-700 text-white hidden lg:flex items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="max-w-[480px] relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4">Venda mais com seu catálogo digital</h1>
          <p className="text-lg text-white/80 mb-12">
            Gerencie produtos, receba pedidos e acompanhe vendas em um só lugar
          </p>

          <ul className="flex flex-col gap-6 mb-16">
            <li className="flex items-center gap-4 text-lg">
              <span className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full text-base">⚡</span>
              <span>Catálogo profissional em minutos</span>
            </li>
            <li className="flex items-center gap-4 text-lg">
              <span className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full text-base">💬</span>
              <span>Pedidos direto pelo WhatsApp</span>
            </li>
            <li className="flex items-center gap-4 text-lg">
              <span className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full text-base">📊</span>
              <span>Acompanhe todas as suas vendas</span>
            </li>
            <li className="flex items-center gap-4 text-lg">
              <span className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full text-base">✅</span>
              <span>Comece grátis, sem cartão</span>
            </li>
          </ul>

          <div className="flex items-center gap-3 pt-8 border-t border-white/10 text-sm">
            <span className="text-xl">👥</span>
            <span>Mais de <strong>1.000 negócios</strong> vendendo todos os dias</span>
          </div>
        </div>
      </div>
    </div>
  )
}
