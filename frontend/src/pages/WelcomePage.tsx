import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, Zap, Share2, ArrowRight, Menu, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useState } from 'react'
import logoPng from '@/assets/logo.png'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/20"
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={logoPng} alt="Vitrine Rápida Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 leading-tight">
                Vitrine Rápida
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Catálogo Online
              </span>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/registro')}
            >
              Criar Conta Grátis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="p-4 space-y-3 shadow-lg">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                  className="w-full justify-start text-gray-600"
                >
                  Entrar na minha conta
                </Button>
                <Button
                  size="lg"
                  onClick={() => { navigate('/registro'); setIsMenuOpen(false); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Criar conta grátis
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100/50 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 shadow-sm"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Junte-se a +500 lojistas ativos
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-8"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            Sua vitrine digital <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              profissional em minutos
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          >
            A plataforma mais simples e elegante para criar catálogos, organizar produtos e vender mais pelo WhatsApp.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center px-4"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/registro')} 
            >
              Começar Grátis <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => navigate('/catalog')}
            >
              Ver Exemplo Real
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500"
            variants={fadeUp}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Sem cartão de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Plano grátis para sempre
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Setup instantâneo
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ferramentas poderosas em uma interface que qualquer pessoa consegue usar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Store, 
                title: 'Catálogos Elegantes', 
                desc: 'Vitrines que valorizam seus produtos com design limpo e profissional.',
                color: 'bg-blue-50 text-blue-600'
              },
              { 
                icon: Share2, 
                title: 'Compartilhamento Fácil', 
                desc: 'Envie o link para seus clientes via WhatsApp, Instagram ou Telegram.',
                color: 'bg-green-50 text-green-600'
              },
              { 
                icon: Zap, 
                title: 'Links Diretos', 
                desc: 'Clientes escolhem os produtos e enviam o pedido direto no seu WhatsApp.',
                color: 'bg-purple-50 text-purple-600'
              },
            ].map((feature, i) => (
              <motion.div 
                key={feature.title} 
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <h2 className="relative text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Pronto para transformar suas vendas?
            </h2>
            <p className="relative text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Não perca mais tempo enviando fotos soltas. Crie seu catálogo profissional agora mesmo.
            </p>
            <motion.div 
              className="relative flex flex-col sm:flex-row gap-4 justify-center"
              whileHover={{ scale: 1.02 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/registro')}
                className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-0 shadow-2xl"
              >
                Criar minha vitrine grátis
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/20">
                <img src={logoPng} alt="Vitrine Rápida Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Vitrine Rápida</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Ajuda</a>
            </div>
            
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Vitrine Rápida. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
