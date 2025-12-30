import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, ImageIcon, Store } from 'lucide-react'

import { collectionsService } from '../api'
import { API_BASE_URL, joinUrl } from '../api/config'
import type { Product } from '../api'
import { Button, Card } from '../components/ui'
import { formatPrice } from '../utils/format'

type CartState = Record<string, number>

function getCartStorageKey(token: string): string {
  return `cart:${token}`
}

export default function PublicCatalogPage() {
  const params = useParams()
  const token = String(params.token ?? '')

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [title, setTitle] = useState('Vitrine')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartState>({})

  useEffect(() => {
    if (!token) return
    try {
      const raw = sessionStorage.getItem(getCartStorageKey(token))
      if (raw) setCart(JSON.parse(raw) as CartState)
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    if (!token) return
    try {
      sessionStorage.setItem(getCartStorageKey(token), JSON.stringify(cart))
    } catch { /* ignore */ }
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
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [token])

  function addToCart(id: number) {
    setCart((prev) => ({ ...prev, [String(id)]: (prev[String(id)] ?? 0) + 1 }))
  }

  function decrement(id: number) {
    setCart((prev) => {
      const key = String(id)
      const qty = prev[key] ?? 0
      if (qty <= 1) {
        const { [key]: _, ...rest } = prev
        void _
        return rest
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">Vitrine Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{totalItems}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {isLoading && <div className="text-center py-12 text-gray-500">Carregando...</div>}
        {!isLoading && errorMessage && <div className="text-center py-12 text-red-600">{errorMessage}</div>}

        {!isLoading && !errorMessage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products */}
            <section className="lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Produtos ({products.length})</h2>

              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Nenhum produto</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <Card key={p.id} variant="bordered">
                      {p.image_url ? (
                        <img src={joinUrl(API_BASE_URL, p.image_url)} alt={p.name} className="w-full h-44 object-cover rounded-lg mb-3" />
                      ) : (
                        <div className="w-full h-44 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                      )}

                      <h3 className="font-medium text-gray-900 mb-1">{p.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">{formatPrice(p.price)}</span>
                        <Button size="sm" onClick={() => addToCart(p.id)}>
                          <Plus className="w-4 h-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Cart */}
            <aside className="lg:sticky lg:top-20 h-fit">
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="font-medium text-gray-900">Carrinho</h2>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-sm py-6 text-center">Carrinho vazio</p>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(({ product, qty }) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                          <button onClick={() => decrement(product.id)} className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">{qty}</span>
                          <button onClick={() => addToCart(product.id)} className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatPrice(total)}</span>
                      </div>
                      <Button className="w-full">Finalizar pedido</Button>
                    </div>
                  </div>
                )}
              </Card>
            </aside>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        Vitrine Digital • Carrinho salvo na sessão
      </footer>
    </div>
  )
}
