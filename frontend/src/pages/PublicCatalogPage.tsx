import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ShoppingCart, Plus, Minus, ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'

import { collectionsService, ApiError, ordersService } from '@/api'
import { API_BASE_URL, joinUrl } from '@/api/config'
import type { Product } from '@/api'
import { Button, Card } from '@/components/ui'
import { formatPrice } from '@/utils/format'


type CartItem = {
  qty: number
  size?: string
}
type CartState = Record<string, CartItem>

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [ownerPhone, setOwnerPhone] = useState('')
  const [storeName, setStoreName] = useState('')
  const [isFinishing, setIsFinishing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  function getProductImages(p: Product): string[] {
    if (p.images && p.images.length > 0) {
      return p.images.sort((a, b) => a.position - b.position).map(img => img.image_url)
    }
    if (p.image_url) {
      return [p.image_url]
    }
    return []
  }

  // Gera uma chave única para o carrinho (produto + tamanho)
  function getCartKey(productId: number, size?: string): string {
    return size ? `${productId}_${size}` : String(productId)
  }

  useEffect(() => {
    if (!token) return
    try {
      const raw = sessionStorage.getItem(`cart:${token}`)
      if (raw) setCart(JSON.parse(raw) as CartState)
    } catch { }
  }, [token])

  useEffect(() => {
    if (!token) return
    try { sessionStorage.setItem(`cart:${token}`, JSON.stringify(cart)) } catch { }
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
        setOwnerPhone(data.owner_phone || '')
        setStoreName(data.store_name || '')
      } catch (err) {
        if (!mounted) return
        setErrorMessage(err instanceof Error ? err.message : 'Erro')
      } finally { if (mounted) setIsLoading(false) }
    }

    void load()
    return () => { mounted = false }
  }, [token])

  function addToCartWithSize(product: Product, size?: string) {
    // Se o produto tem tamanhos mas nenhum foi selecionado
    if (product.sizes && !size) {
      setSizeError(true)
      return
    }

    setSizeError(false)
    const key = getCartKey(product.id, size)

    setCart((prev) => {
      const isFirstItem = Object.keys(prev).length === 0
      if (isFirstItem) setIsCartOpen(true)

      const existing = prev[key]
      return {
        ...prev,
        [key]: {
          qty: (existing?.qty ?? 0) + 1,
          size
        }
      }
    })
  }

  function incrementCartItem(key: string) {
    setCart((prev) => {
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, qty: existing.qty + 1 } }
    })
  }

  function decrementCartItem(key: string) {
    setCart((prev) => {
      const existing = prev[key]
      if (!existing) return prev
      if (existing.qty <= 1) {
        const { [key]: _, ...rest } = prev
        void _
        return rest
      }
      return { ...prev, [key]: { ...existing, qty: existing.qty - 1 } }
    })
  }

  const cartItems = useMemo(() => {
    const items: Array<{ product: Product; qty: number; size?: string; key: string }> = []

    for (const [key, item] of Object.entries(cart)) {
      // Extrai o ID do produto da chave (formato: "id" ou "id_size")
      const productId = parseInt(key.split('_')[0])
      const product = products.find(p => p.id === productId)
      if (product && item.qty > 0) {
        items.push({ product, qty: item.qty, size: item.size, key })
      }
    }
    return items
  }, [cart, products])

  const total = useMemo(() => cartItems.reduce((acc, i) => acc + i.product.price * i.qty, 0), [cartItems])
  const totalItems = useMemo(() => cartItems.reduce((acc, i) => acc + i.qty, 0), [cartItems])

  async function handleFinishOrder() {
    if (cartItems.length === 0 || !ownerPhone) return
    setIsFinishing(true)
    setCheckoutError(null)

    try {
      const input = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.qty,
          size: item.size
        }))
      }

      const { order_token } = await ordersService.create(input)

      const phoneNumber = ownerPhone.replace(/\D/g, '')

      let message = `🛒 *Novo Pedido - ${title}* (#${order_token.substring(0, 5)})\n\n`
      message += `📦 *Itens do pedido:*\n`

      cartItems.forEach(({ product, qty, size }) => {
        const sizeText = size ? ` (Tam: ${size})` : ''
        message += `• ${product.name}${sizeText} - Qtd: ${qty} - ${formatPrice(product.price * qty)}\n`
      })

      message += `\n💰 *Total: ${formatPrice(total)}*`
      message += `\n\n🔗 *Acompanhe seu pedido:* ${window.location.origin}/pedido/${order_token}`

      const encodedMessage = encodeURIComponent(message)

      window.open(`https://wa.me/55${phoneNumber}?text=${encodedMessage}`, '_blank')

      setCart({})
      setIsCartOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCheckoutError(`Estoque insuficiente: ${err.message}`)
      } else {
        setCheckoutError('Erro ao criar pedido. Tente novamente.')
      }
      console.error(err)
    } finally {
      setIsFinishing(false)
    }
  }

  // Reset tamanho selecionado quando abre modal de produto
  function openProductModal(p: Product) {
    setSelectedProduct(p)
    setSelectedImageIndex(0)
    setSelectedSize(null)
    setSizeError(false)
  }

  // Adiciona ao carrinho do modal (com validação de tamanho)
  function addFromModal() {
    if (!selectedProduct) return

    if (selectedProduct.sizes && !selectedSize) {
      setSizeError(true)
      return
    }

    addToCartWithSize(selectedProduct, selectedSize ?? undefined)
    setSelectedProduct(null)
    setSelectedSize(null)
    setSizeError(false)
  }

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
              className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-blue-200/50"
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={logoSvg} alt="Vitrine Rápida Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 leading-tight">
                {storeName || 'Vitrine Rápida'}
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Catálogo Digital
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
                        onClick={() => openProductModal(p)}
                      >
                        {(() => {
                          const productImages = getProductImages(p)
                          if (productImages.length > 0) {
                            return (
                              <div className="relative">
                                <motion.img
                                  src={joinUrl(API_BASE_URL, productImages[0])}
                                  alt={p.name}
                                  className="w-full h-44 object-cover rounded-lg mb-3 transition-all group-hover:scale-[1.02] group-hover:shadow-lg"
                                  whileHover={{ scale: 1.03 }}
                                  transition={{ type: 'spring', stiffness: 300 }}
                                />
                                {productImages.length > 1 && (
                                  <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                    +{productImages.length - 1}
                                  </span>
                                )}
                              </div>
                            )
                          } else {
                            return (
                              <div className="w-full h-44 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                <ImageIcon className="w-10 h-10 text-gray-300" />
                              </div>
                            )
                          }
                        })()}

                        <h3 className="font-medium text-gray-900 mb-1">{p.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{p.description}</p>

                        {/* Tamanhos disponíveis */}
                        {p.sizes && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.sizes.split(',').map((size) => (
                              <span
                                key={size}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                              >
                                {size.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">{formatPrice(p.price)}</span>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Se tem tamanhos, abre o modal para escolher
                              if (p.sizes) {
                                openProductModal(p)
                              } else {
                                addToCartWithSize(p)
                              }
                            }}
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
                          {cartItems.map(({ product, qty, size, key }) => (
                            <motion.div
                              key={key}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              layout
                            >
                              {(() => {
                                const cartImages = getProductImages(product)
                                if (cartImages.length > 0) {
                                  return <img src={joinUrl(API_BASE_URL, cartImages[0])} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                }
                                return (
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                  </div>
                                )
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500">{formatPrice(product.price)}</p>
                                  {size && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                      {size}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <motion.button
                                  onClick={() => decrementCartItem(key)}
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
                                  onClick={() => incrementCartItem(key)}
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
                          {checkoutError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-3">
                              {checkoutError}
                            </div>
                          )}
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
                          <Button className="w-full" onClick={() => void handleFinishOrder()} isLoading={isFinishing} disabled={!ownerPhone || isFinishing}>Finalizar pedido</Button>
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

              {(() => {
                const productImages = getProductImages(selectedProduct)
                const currentImage = productImages[selectedImageIndex] || productImages[0]

                return (
                  <div className="relative">
                    {currentImage ? (
                      <img
                        src={joinUrl(API_BASE_URL, currentImage)}
                        alt={selectedProduct.name}
                        className="w-full max-h-[60vh] object-contain bg-gray-50"
                      />
                    ) : (
                      <div className="w-full max-h-[60vh] bg-gray-100 flex items-center justify-center py-20">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}

                    {/* Navigation arrows */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                          onClick={() => setSelectedImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                          aria-label="Imagem anterior"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                          onClick={() => setSelectedImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                          aria-label="Próxima imagem"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>

                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {productImages.map((_, idx) => (
                            <button
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-colors ${idx === selectedImageIndex ? 'bg-blue-600' : 'bg-white/60'}`}
                              onClick={() => setSelectedImageIndex(idx)}
                              aria-label={`Ver imagem ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Produto</p>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h3>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700 whitespace-nowrap">{formatPrice(selectedProduct.price)}</span>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{selectedProduct.description}</p>

                {/* Seleção de Tamanho (obrigatória se o produto tem tamanhos) */}
                {selectedProduct.sizes && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Escolha o tamanho:</span>
                      {sizeError && (
                        <span className="text-sm text-red-500 font-medium">* Obrigatório</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.split(',').map((size) => {
                        const trimmedSize = size.trim()
                        const isSelected = selectedSize === trimmedSize
                        return (
                          <button
                            key={trimmedSize}
                            onClick={() => {
                              setSelectedSize(trimmedSize)
                              setSizeError(false)
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : sizeError
                                ? 'bg-white text-gray-700 border-red-300 hover:border-red-400'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                              }`}
                          >
                            {trimmedSize}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={addFromModal}>
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
        Vitrine Rápida • Carrinho salvo na sessão
      </footer>
    </div>
  )
}
