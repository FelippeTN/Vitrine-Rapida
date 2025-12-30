import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Zap, Share2, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui'

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="border-b border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Store className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-lg font-semibold text-gray-900">Vitrine Digital</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/registro')}>
              Criar conta grátis
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="py-20 px-6">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.span 
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            +500 lojistas ativos
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            Crie sua vitrine digital em minutos
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          >
            A forma mais simples de criar catálogos profissionais e compartilhar com seus clientes.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={fadeUp}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
          >
            <Button size="lg" onClick={() => navigate('/registro')} className="gap-2">
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
              Já tenho conta
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simples, rápido e profissional
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Tudo que você precisa para mostrar seus produtos de forma elegante
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Store, title: 'Catálogos Elegantes', desc: 'Crie vitrines bonitas para seus produtos em poucos cliques' },
              { icon: Share2, title: 'Compartilhe Fácil', desc: 'Envie o link para clientes via WhatsApp ou redes sociais' },
              { icon: Zap, title: 'Super Rápido', desc: 'Interface intuitiva que qualquer pessoa consegue usar' },
            ].map((feature, i) => (
              <motion.div 
                key={feature.title} 
                className="bg-white p-6 rounded-2xl border border-gray-200"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
              >
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </motion.div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div 
            className="bg-blue-600 rounded-3xl p-12 text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Crie sua conta gratuita e comece a impressionar seus clientes hoje.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/registro')}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Criar minha vitrine grátis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Vitrine Digital</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Termos</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Privacidade</a>
          </div>
          
          <p className="text-sm text-gray-500">© 2025 Vitrine Digital</p>
        </div>
      </footer>
    </div>
  )
}
