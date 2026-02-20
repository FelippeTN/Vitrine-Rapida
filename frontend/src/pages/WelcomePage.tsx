import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Store, 
  Zap, 
  Share2, 
  ArrowRight, 
  Menu, 
  X, 
  CheckCircle2, 
  Smartphone, 
  ShoppingBag, 
  Users,
  Mail,
  MessageCircle,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useState } from 'react'
import logoSvg from '@/assets/logo.svg'

// Animation Variants
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const features = [
    { 
      icon: Store, 
      title: 'Sua Loja Online', 
      desc: 'Personalize sua vitrine com sua marca, cores e identidade visual em poucos cliques.',
      color: 'bg-[#e6f5f3] text-[#075E54]'
    },
    { 
      icon: Smartphone, 
      title: 'Perfeito no Celular', 
      desc: 'Seus clientes navegam com facilidade em uma interface pensada 100% para mobile.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    { 
      icon: Zap, 
      title: 'Pedidos no WhatsApp', 
      desc: 'Receba pedidos prontos e organizados diretamente no seu WhatsApp.',
      color: 'bg-amber-50 text-amber-600'
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Crie sua Conta',
      desc: 'Cadastro rápido em menos de 1 minuto. Sem burocracia.',
      icon: usersIcon()
    },
    {
      step: '02',
      title: 'Adicione Produtos',
      desc: 'Cadastre fotos, preços e descrições de forma simples.',
      icon: bagIcon()
    },
    {
      step: '03',
      title: 'Comece a Vender',
      desc: 'Compartilhe seu link exclusivo e receba pedidos.',
      icon: shareIcon()
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#e6f5f3] selection:text-[#075E54]">
      
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#25D366] blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <img src={logoSvg} alt="Vitrine Rápida" className="relative w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Vitrine Rápida
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <nav className="flex gap-6 mr-4 text-sm font-medium text-gray-600">
              <a href="#como-funciona" className="hover:text-[#075E54] transition-colors">Como Funciona</a>
              <a href="#contato" className="hover:text-[#075E54] transition-colors">Contato</a>
            </nav>
            <div className="h-6 w-px bg-gray-200"></div>
            <Button variant="ghost" className="font-medium" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/registro')} className="shadow-lg shadow-[#075E54]/20 hover:shadow-[#075E54]/30 transition-all">
              Criar Vitrine Grátis
            </Button>
          </div>

          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white"
            >
              <div className="p-4 space-y-4">
                <nav className="flex flex-col gap-4 text-sm font-medium text-gray-600 mb-4">
                  <a href="#como-funciona" onClick={() => setIsMenuOpen(false)}>Como Funciona</a>
                  <a href="#contato" onClick={() => setIsMenuOpen(false)}>Contato</a>
                </nav>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => navigate('/login')}>Entrar</Button>
                  <Button onClick={() => navigate('/registro')}>Cadastrar</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#25D366]/10 blur-[100px] rounded-full mix-blend-multiply filter opacity-70 animate-blob"></div>
            <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-400/10 blur-[100px] rounded-full mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div 
              className="max-w-4xl mx-auto text-center"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#25D366]/30 text-[#075E54] text-xs font-bold uppercase tracking-wide mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                A plataforma #1 para vender no WhatsApp
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                Sua vitrine profissional <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#075E54] to-[#25D366]">
                  pronta em minutos
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Transforme seu WhatsApp em uma máquina de vendas. Crie um catálogo digital elegante, organize seus produtos e facilite a vida do seu cliente.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-[#075E54]/20 hover:shadow-[#075E54]/30 hover:scale-105 transition-all duration-300" onClick={() => navigate('/registro')}>
                  Começar Agora Grátis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="text-sm text-gray-500 flex items-center gap-4 mt-4 sm:mt-0">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#25D366]" /> Sem cartão</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#25D366]" /> Setup grátis</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Catalog Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 100, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Desktop Browser Preview */}
                <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                  {/* Fake Browser Header */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-4 flex-1 bg-white h-6 rounded-md border border-gray-200 text-xs flex items-center px-2 text-gray-400 font-mono">
                      vitrinerapida.com/c/minha-loja
                    </div>
                  </div>

                  {/* Catalog Content */}
                  <div className="bg-gradient-to-br from-slate-50 to-[#e6f5f3] p-6">
                    {/* Store Header */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#075E54] to-[#25D366] mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        ML
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Moda & Lifestyle</h3>
                      <p className="text-sm text-gray-500">Roupas e acessórios exclusivos</p>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Camiseta Premium', price: 'R$ 89,90', color: 'bg-rose-100' },
                        { name: 'Calça Jeans Slim', price: 'R$ 159,90', color: 'bg-[#ccebe6]' },
                        { name: 'Tênis Casual', price: 'R$ 249,90', color: 'bg-amber-100' },
                        { name: 'Bolsa Couro', price: 'R$ 199,90', color: 'bg-emerald-100' },
                        { name: 'Relógio Classic', price: 'R$ 329,90', color: 'bg-purple-100' },
                        { name: 'Óculos Solar', price: 'R$ 179,90', color: 'bg-orange-100' },
                      ].map((product, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className={`${product.color} h-24 flex items-center justify-center`}>
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm font-bold text-[#075E54]">{product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* WhatsApp Button */}
                    <div className="mt-6 text-center">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-medium shadow-lg shadow-[#25D366]/30 hover:bg-[#1fb855] transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        Fazer Pedido no WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Phone Preview */}
                <div className="hidden md:block relative">
                  <div className="w-[280px] h-[560px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                      {/* Phone Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                      
                      {/* Phone Content */}
                      <div className="h-full overflow-hidden bg-gradient-to-br from-slate-50 to-[#e6f5f3] pt-8 px-4 pb-4">
                        {/* Store Header */}
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#075E54] to-[#25D366] mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold">
                            ML
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">Moda & Lifestyle</h4>
                        </div>

                        {/* Products */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Camiseta', price: 'R$ 89,90', color: 'bg-rose-100' },
                            { name: 'Calça Jeans', price: 'R$ 159,90', color: 'bg-[#ccebe6]' },
                            { name: 'Tênis', price: 'R$ 249,90', color: 'bg-amber-100' },
                            { name: 'Bolsa', price: 'R$ 199,90', color: 'bg-emerald-100' },
                          ].map((p, i) => (
                            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                              <div className={`${p.color} h-16 flex items-center justify-center`}>
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs font-bold text-[#075E54]">{p.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* WhatsApp Button Mobile */}
                        <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-full text-sm font-medium">
                          <MessageCircle className="w-4 h-4" />
                          Pedir via WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#25D366]/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="como-funciona" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[#075E54] font-semibold tracking-wide uppercase text-sm">Passo a Passo</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">Como funciona sua Vitrine</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Tudo desenhado para você não perder tempo com tecnologia e focar no que importa: vender.</p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-12">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  className="relative flex flex-col items-center text-center group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 max-w-xs">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#075E54] to-[#064e46] rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#075E54]/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Pronto para digitalizar sua loja?
              </h2>
              <p className="text-[#25D366]/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
                Crie sua conta agora e tenha sua vitrine pronta ainda hoje. Sem custo, sem compromisso.
              </p>
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg rounded-full bg-white text-[#075E54] hover:bg-[#e6f5f3] hover:text-[#064e46] shadow-2xl hover:scale-105 transition-transform font-bold border-none"
                onClick={() => navigate('/registro')}
              >
                Criar Vitrine Grátis
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contato" className="bg-slate-50 border-t border-gray-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                   <img src={logoSvg} alt="VR" className="w-10 h-10" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Vitrine Rápida</span>
                </div>
                <p className="text-gray-500 max-w-xs mb-6">
                  A plataforma completa para você vender mais e melhor através do WhatsApp.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-6">Contato & Suporte</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-600">
                    <Mail className="w-5 h-5 text-[#25D366] mt-0.5" />
                    <span>vitrinerapida.suporte@gmail.com</span>
                  </li>
                  <li className="text-sm text-gray-400 mt-2">
                    Seg a Sex, 9h às 18h
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                <ul className="space-y-3">
                  <li><Link to="/termos" className="text-gray-600 hover:text-[#075E54]">Termos de Uso</Link></li>
                  <li><Link to="/privacidade" className="text-gray-600 hover:text-[#075E54]">Política de Privacidade</Link></li>
                  <li><Link to="/cookies" className="text-gray-600 hover:text-[#075E54]">Cookies</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <p>© 2025 Vitrine Rápida. Feito com ❤️ e café.</p>
              <div className="flex gap-6">
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function usersIcon() {
  return <Users className="w-8 h-8 text-[#075E54]" />
}

function bagIcon() {
  return <ShoppingBag className="w-8 h-8 text-[#075E54]" />
}

function shareIcon() {
  return <Share2 className="w-8 h-8 text-[#075E54]" />
}
