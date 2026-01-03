import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ShoppingCart, Plus, Minus, ImageIcon, Store, X } from 'lucide-react'

import { collectionsService } from '@/api'
import { API_BASE_URL, joinUrl } from '@/api/config'
import type { Product } from '@/api'
import { Button, Card } from '@/components/ui'
import { formatPrice } from '@/utils/format'

type CartState = Record<string, number>

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function PublicCatalogPage() {
  const params = useParams()
  const token = String(params.token ?? '')

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [title, setTitle] = useState('Vitrine')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartState>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    try {
      const raw = sessionStorage.getItem(`cart:${token}`)
      if (raw) setCart(JSON.parse(raw) as CartState)
    } catch {}
  }, [token])

  useEffect(() => {
    if (!token) return
    try { sessionStorage.setItem(`cart:${token}`, JSON.stringify(cart)) } catch {}
  }, [cart, token])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!token) { setErrorMessage('Link inválido'); setIsLoading(false); return }
      try {
        setIsLoading(true)
        const data = await collectionsService.getPublicCatalogByToken(token)
        if (!mounted) return
        setTitle(data.collection.name || 'Vitrine')
        setProducts(data.products)
      } catch (err) {
        if (!mounted) return
        setErrorMessage(err instanceof Error ? err.message : 'Erro')
      } finally { if (mounted) setIsLoading(false) }
    }

    void load()
    return () => { mounted = false }
  }, [token])

  function addToCart(id: number) {
    setCart((prev) => {
      const isFirstItem = Object.keys(prev).length === 0
      if (isFirstItem) setIsCartOpen(true)
      return { ...prev, [String(id)]: (prev[String(id)] ?? 0) + 1 }
    })
  }

  function decrement(id: number) {
    setCart((prev) => {
      const key = String(id)
      const qty = prev[key] ?? 0
      if (qty <= 1) { const { [key]: _, ...rest } = prev; void _; return rest }
      return { ...prev, [key]: qty - 1 }
    })
  }

  const cartItems = useMemo(() => {
    const items: Array<{ product: Product; qty: number }> = []
    for (const p of products) {
      const qty = cart[String(p.id)] ?? 0
      if (qty > 0) items.push({ product: p, qty })
    }
    return items
  }, [cart, products])

  const total = useMemo(() => cartItems.reduce((acc, i) => acc + i.product.price * i.qty, 0), [cartItems])
  const totalItems = useMemo(() => cartItems.reduce((acc, i) => acc + i.qty, 0), [cartItems])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Padrão */}
      <motion.header
        className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo e Marca */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <motion.div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200/50"
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Store className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 leading-tight">
                Vitrine Digital
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Catálogo Online
              </span>
            </div>
          </Link>

          {/* Carrinho */}
          <motion.button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full cursor-pointer hover:bg-blue-100/70 transition-colors"
            onClick={() => setIsCartOpen((prev) => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <motion.span 
              className="text-sm font-bold text-blue-700"
              key={totalItems}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {totalItems}
            </motion.span>
          </motion.button>
        </div>
      </motion.header>

      {/* Título da Vitrine */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">Confira os produtos disponíveis</p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {isLoading && (
          <div className="text-center py-12 text-gray-500">
            <motion.div 
              className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Carregando...
          </div>
        )}
        
        {!isLoading && errorMessage && <div className="text-center py-12 text-red-600">{errorMessage}</div>}

        {!isLoading && !errorMessage && (
          <motion.div 
            className={`grid grid-cols-1 gap-6 ${isCartOpen ? 'lg:grid-cols-3' : ''}`}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Products */}
            <motion.section 
              className={isCartOpen ? 'lg:col-span-2' : ''}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <motion.h2 
                className="font-semibold text-gray-900 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Produtos ({products.length})
              </motion.h2>

              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Nenhum produto</div>
              ) : (
                <motion.div 
                  className={`grid grid-cols-1 gap-4 ${isCartOpen ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {products.map((p) => (
                    <motion.div key={p.id} variants={staggerItem} layout>
                      <Card
                        variant="bordered"
                        animate={false}
                        className="group cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {p.image_url ? (
                          <motion.img 
                            src={joinUrl(API_BASE_URL, p.image_url)} 
                            alt={p.name} 
                            className="w-full h-44 object-cover rounded-lg mb-3 transition-all group-hover:scale-[1.02] group-hover:shadow-lg"
                            whileHover={{ scale: 1.03 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          />
                        ) : (
                          <div className="w-full h-44 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-300" />
                          </div>
                        )}

                        <h3 className="font-medium text-gray-900 mb-1">{p.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">{formatPrice(p.price)}</span>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); addToCart(p.id) }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>

            {/* Cart */}
            <AnimatePresence mode="popLayout">
              {isCartOpen && (
                <motion.aside 
                  className="lg:sticky lg:top-20 h-fit"
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 30 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="font-medium text-gray-900">Carrinho</h2>
                      </div>
                      <button
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setIsCartOpen(false)}
                        aria-label="Fechar carrinho"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {cartItems.length === 0 ? (
                      <p className="text-gray-500 text-sm py-6 text-center">Carrinho vazio</p>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence initial={false} mode="popLayout">
                          {cartItems.map(({ product, qty }) => (
                            <motion.div 
                              key={product.id} 
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              layout
                            >
                              {product.image_url ? (
                                <img src={joinUrl(API_BASE_URL, product.image_url)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">{formatPrice(product.price)}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <motion.button 
                                  onClick={() => decrement(product.id)} 
                                  className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Minus className="w-3 h-3" />
                                </motion.button>
                                <motion.span 
                                  className="w-5 text-center text-sm font-medium"
                                  key={qty}
                                  initial={{ scale: 1.3 }}
                                  animate={{ scale: 1 }}
                                >
                                  {qty}
                                </motion.span>
                                <motion.button 
                                  onClick={() => addToCart(product.id)} 
                                  className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Plus className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between mb-3">
                            <span className="text-gray-600">Total</span>
                            <motion.span 
                              className="text-xl font-bold text-blue-600"
                              key={total}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                            >
                              {formatPrice(total)}
                            </motion.span>
                          </div>
                          <Button className="w-full">Finalizar pedido</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.aside>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                onClick={() => setSelectedProduct(null)}
                aria-label="Fechar visualização do produto"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>

              {selectedProduct.image_url ? (
                <img
                  src={joinUrl(API_BASE_URL, selectedProduct.image_url)}
                  alt={selectedProduct.name}
                  className="w-full max-h-[60vh] object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full max-h-[60vh] bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}

              <div className="p-6 md:p-8 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Produto</p>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h3>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700 whitespace-nowrap">{formatPrice(selectedProduct.price)}</span>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{selectedProduct.description}</p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null) }}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Colocar no carrinho
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-6 text-center text-sm text-gray-500">
        Vitrine Digital • Carrinho salvo na sessão
      </footer>
    </div>
  )
}
