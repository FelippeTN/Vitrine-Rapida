import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Crown, Building2 } from 'lucide-react'

import { plansService, isUnauthorized } from '@/api'
import type { Plan, UserPlanInfo } from '@/api'
import { PageLayout, staggerContainer, staggerItem } from '@/components/layout'
import { type User } from '@/components/layout/Header'
import { Button, Card } from '@/components/ui'
import { PaymentModal } from '@/components/PaymentModal'

interface PlansPageProps {
  onLogout: () => void
  user: User | null
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-600',
  pro: 'bg-purple-100 text-purple-600',
  enterprise: 'bg-amber-100 text-amber-600',
}

export default function PlansPage({ onLogout, user }: PlansPageProps) {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<number | null>(null)
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const [plansData, infoData] = await Promise.all([
          plansService.getAll(),
          plansService.getMyPlanInfo(),
        ])
        setPlans(plansData)
        setPlanInfo(infoData)
      } catch (err) {
        if (isUnauthorized(err)) {
          onLogout()
          navigate('/login', { replace: true })
        }
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [navigate, onLogout])

  async function handleUpgrade(plan: Plan) {
    if (plan.price > 0) {
      setSelectedPlanForPayment(plan)
      setIsPaymentOpen(true)
      return
    }

    await processUpgrade(plan.id)
  }

  async function processUpgrade(planId: number) {
    try {
      setIsUpgrading(planId)
      await plansService.upgradePlan(planId)
      // Reload plan info
      const infoData = await plansService.getMyPlanInfo()
      setPlanInfo(infoData)
      setIsPaymentOpen(false)
    } catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
      }
    } finally {
      setIsUpgrading(null)
    }
  }

  function handlePaymentSuccess() {
    if (selectedPlanForPayment) {
       processUpgrade(selectedPlanForPayment.id)
    }
  }

  function parseFeatures(features: string): string[] {
    try {
      return JSON.parse(features) as string[]
    } catch {
      return []
    }
  }

  function formatPrice(price: number): string {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  function formatLimit(limit: number): string {
    return limit === -1 ? 'Ilimitado' : String(limit)
  }

  return (
    <PageLayout isAuthenticated={true} onLogout={() => { onLogout(); navigate('/') }} user={user}>
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu plano</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Aumente os limites da sua conta e desbloqueie recursos exclusivos
        </p>
      </motion.div>

      {/* Current plan info */}
      {planInfo && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Seu plano atual</p>
                <h3 className="text-xl font-bold text-gray-900">{planInfo.plan.display_name}</h3>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {planInfo.product_count}/{formatLimit(planInfo.plan.max_products)}
                  </p>
                  <p className="text-xs text-gray-500">Produtos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {planInfo.collection_count}/{formatLimit(planInfo.plan.max_collections)}
                  </p>
                  <p className="text-xs text-gray-500">Vitrines</p>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Produtos utilizados</span>
                  <span>{Math.round((planInfo.product_count / (planInfo.plan.max_products === -1 ? 100 : planInfo.plan.max_products)) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (planInfo.product_count / (planInfo.plan.max_products === -1 ? 100 : planInfo.plan.max_products)) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Vitrines utilizadas</span>
                  <span>{Math.round((planInfo.collection_count / (planInfo.plan.max_collections === -1 ? 100 : planInfo.plan.max_collections)) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (planInfo.collection_count / (planInfo.plan.max_collections === -1 ? 100 : planInfo.plan.max_collections)) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">
          <motion.div
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Carregando planos...
        </div>
      )}

      {/* Plans grid */}
      {!isLoading && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {plans.map((plan) => {
            const isCurrentPlan = planInfo?.plan.id === plan.id
            const features = parseFeatures(plan.features)
            const isPro = plan.name === 'pro'

            return (
              <motion.div key={plan.id} variants={staggerItem}>
                <Card
                  className={`relative h-full flex flex-col ${
                    isPro ? 'border-2 border-purple-400 shadow-lg shadow-purple-100' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Mais popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Atual
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl ${planColors[plan.name] || 'bg-gray-100 text-gray-600'} flex items-center justify-center mx-auto mb-3`}
                      >
                        {planIcons[plan.name] || <Sparkles className="w-6 h-6" />}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.display_name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                      {plan.price > 0 && <span className="text-gray-500 text-sm">/mês</span>}
                    </div>

                    {/* Limits */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Produtos</span>
                        <span className="font-medium text-gray-900">{formatLimit(plan.max_products)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">Vitrines</span>
                        <span className="font-medium text-gray-900">{formatLimit(plan.max_collections)}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action */}
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'secondary' : isPro ? 'primary' : 'secondary'}
                    disabled={isCurrentPlan || isUpgrading !== null}
                    isLoading={isUpgrading === plan.id}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {isCurrentPlan ? 'Plano atual' : plan.price === 0 ? 'Selecionar' : 'Fazer upgrade'}
                  </Button>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {selectedPlanForPayment && (
        <PaymentModal 
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          amount={Math.round(selectedPlanForPayment.price * 100)}
          planName={selectedPlanForPayment.display_name}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* FAQ or info */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-gray-500">
          Dúvidas? Entre em contato conosco pelo email{' '}
          <a href="mailto:suporte@vitrinedigital.com" className="text-blue-600 hover:underline">
            suporte@vitrinedigital.com
          </a>
        </p>
      </motion.div>
    </PageLayout>
  )
}
