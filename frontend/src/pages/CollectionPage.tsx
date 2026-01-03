import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ImageIcon, Trash2, Pencil, Save, X, Share2 } from 'lucide-react'

import { collectionsService, isUnauthorized, productsService } from '@/api'
import { API_BASE_URL, joinUrl } from '@/api/config'
import type { Collection, Product } from '@/api'
import { PageLayout, staggerContainer, staggerItem } from '@/components/layout'
import { Button, Card, Input } from '@/components/ui'
import { formatPrice, formatCurrencyInput, parseCurrencyInput } from '@/utils/format'

interface CollectionPageProps {
  onLogout: () => void
}

export default function CollectionPage({ onLogout }: CollectionPageProps) {
  const navigate = useNavigate()
  const params = useParams()
  const collectionId = useMemo(() => Number(params.id), [params.id])

  const [collection, setCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isEditingCollection, setIsEditingCollection] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [editProductDescription, setEditProductDescription] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductImage, setEditProductImage] = useState<File | null>(null)

  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  async function load() {
    if (!Number.isFinite(collectionId) || collectionId <= 0) {
      setErrorMessage('Vitrine inválida')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const [cols, prods] = await Promise.all([
        collectionsService.getMine(),
        productsService.getMine(),
      ])

      const found = cols.find((c) => c.id === collectionId) ?? null
      setCollection(found)
      setProducts(prods.filter((p) => p.collection_id === collectionId))
      setCollectionName(found?.name ?? '')
      setCollectionDescription(found?.description ?? '')

      if (!found) setErrorMessage('Vitrine não encontrada')
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }); return }
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [collectionId])

  function handlePriceChange(value: string, setter: (v: string) => void) {
    setter(formatCurrencyInput(value))
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)

    const trimmedName = name.trim()
    const trimmedDesc = description.trim()
    const parsedPrice = parseCurrencyInput(price)

    if (!trimmedName) { setSaveError('Digite o nome'); return }
    if (!trimmedDesc) { setSaveError('Digite a descrição'); return }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) { setSaveError('Preço inválido'); return }

    try {
      setIsSaving(true)
      await productsService.create({ name: trimmedName, description: trimmedDesc, price: parsedPrice, collection_id: collectionId, image })
      setName(''); setDescription(''); setPrice(''); setImage(null)

      await load()
      setShowCreateForm(false)
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }); return }
      setSaveError(err instanceof Error ? err.message : 'Erro')
    } finally { setIsSaving(false) }
  }

  async function handleDeleteCollection() {
    if (!collection || !window.confirm('Apagar vitrine e produtos?')) return
    try { await collectionsService.remove(collection.id); navigate('/catalogos', { replace: true }) }
    catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
  }

  async function handleUpdateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!collection || !collectionName.trim()) return
    try {
      setIsUpdatingCollection(true)
      await collectionsService.update(collection.id, { name: collectionName.trim(), description: collectionDescription.trim() || undefined })
      setIsEditingCollection(false)
      await load()
    } catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
    finally { setIsUpdatingCollection(false) }
  }

  async function handleShareCollection() {
    if (!collection) return
    try {
      const res = await collectionsService.share(collection.id)
      const url = `${window.location.origin}/c/${res.share_token}`
      await navigator.clipboard.writeText(url).catch(() => {})
      window.prompt('Link copiado:', url)
    } catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
  }

  function startEditProduct(p: Product) { 
    setEditingProductId(p.id)
    setEditProductName(p.name)
    setEditProductDescription(p.description)
    setEditProductPrice(formatPrice(p.price))
    setEditProductImage(null) 
  }
  function cancelEditProduct() { setEditingProductId(null) }

  async function saveProductEdit(id: number) {
    const trimmedName = editProductName.trim()
    const trimmedDesc = editProductDescription.trim()
    const parsedPrice = parseCurrencyInput(editProductPrice)
    if (!trimmedName || !trimmedDesc || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return
    try {
      setIsUpdatingProduct(true)
      await productsService.update(id, { name: trimmedName, description: trimmedDesc, price: parsedPrice, collection_id: collectionId, image: editProductImage })
      cancelEditProduct(); await load()
    } catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
    finally { setIsUpdatingProduct(false) }
  }

  async function deleteProduct(id: number) {
    if (!window.confirm('Apagar produto?')) return
    try { await productsService.remove(id); if (editingProductId === id) cancelEditProduct(); await load() }
    catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
  }

  return (
    <PageLayout isAuthenticated={true} onLogout={() => { onLogout(); navigate('/') }}>
      {/* Breadcrumb */}
      <motion.div 
        className="mb-4 flex items-center gap-2 text-sm"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button 
          onClick={() => navigate('/catalogos')}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          Minhas Vitrines
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{collection?.name || 'Carregando...'}</span>
      </motion.div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">
          <motion.div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          Carregando...
        </div>
      )}
      {!isLoading && errorMessage && <div className="text-center py-12 text-red-600">{errorMessage}</div>}

      {!isLoading && collection && (
        <>
          {/* Collection header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-900">{collection.name}</h2>
                <p className="text-sm text-gray-500">{collection.description || 'Sem descrição'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => void handleShareCollection()}><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingCollection(!isEditingCollection)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="danger" size="sm" onClick={() => void handleDeleteCollection()}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>

            {isEditingCollection && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 mt-4 pt-4 border-t border-gray-200" onSubmit={handleUpdateCollection}>
                <Input placeholder="Nome" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className="flex-1" />
                <Input placeholder="Descrição" value={collectionDescription} onChange={(e) => setCollectionDescription(e.target.value)} className="flex-1" />
                <Button type="submit" isLoading={isUpdatingCollection}>Salvar</Button>
                <Button variant="ghost" type="button" onClick={() => setIsEditingCollection(false)}><X className="w-4 h-4" /></Button>
              </motion.form>
            )}
          </Card>



          {/* Products */}
          <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-medium text-gray-900">Produtos ({products.length})</h2>
          </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={staggerContainer} initial="hidden" animate="show">


              {products.map((p) => (
                <motion.div key={p.id} variants={staggerItem}>
                  <Card variant="bordered" animate={false}>
                    {editingProductId === p.id ? (
                      <div className="space-y-3">
                        <Input placeholder="Nome" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} />
                        <Input placeholder="Descrição" value={editProductDescription} onChange={(e) => setEditProductDescription(e.target.value)} />
                        <Input placeholder="Preço" value={editProductPrice} onChange={(e) => handlePriceChange(e.target.value, setEditProductPrice)} />
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-600">{editProductImage ? editProductImage.name : 'Alterar imagem'}</span>
                          <input type="file" accept="image/*" onChange={(e) => setEditProductImage(e.target.files?.[0] ?? null)} className="hidden" />
                        </label>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void saveProductEdit(p.id)} isLoading={isUpdatingProduct}><Save className="w-4 h-4 mr-1" />Salvar</Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditProduct}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {p.image_url ? (
                          <motion.img
                            src={joinUrl(API_BASE_URL, p.image_url)}
                            alt={p.name}
                            className="w-full h-40 object-cover rounded-lg mb-3 cursor-zoom-in"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={() => setPreviewProduct(p)}
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{p.name}</h3>
                          <span className="font-semibold text-blue-600">{formatPrice(p.price)}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEditProduct(p)} className="flex-1"><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                          <Button variant="danger" size="sm" onClick={() => void deleteProduct(p.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              ))}


              {/* Add Product Card */}
              <motion.div variants={staggerItem} className="h-full">
                <Card 
                  className={`h-full flex flex-col justify-center relative ${!showCreateForm ? 'min-h-[300px] items-center cursor-pointer hover:bg-gray-50 border-dashed border-2' : ''}`}
                  onClick={!showCreateForm ? () => setShowCreateForm(true) : undefined}
                  animate={false}
                >
                  {!showCreateForm ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="font-medium">Adicionar produto</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowCreateForm(false); }}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <h3 className="font-medium text-gray-900 mb-4">Novo Produto</h3>

                      <form className="flex flex-col gap-3" onSubmit={handleCreateProduct}>
                        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} autoFocus />
                        <Input placeholder="R$ 0,00" value={price} onChange={(e) => handlePriceChange(e.target.value, setPrice)} disabled={isSaving} />
                        <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving} />
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 truncate max-w-[80px]">{image ? image.name : 'Imagem'}</span>
                          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="hidden" />
                        </label>
                        <Button type="submit" isLoading={isSaving} className="w-full">
                          Adicionar
                        </Button>
                      </form>
                      {saveError && <p className="text-sm text-red-600 mt-2">{saveError}</p>}
                    </div>
                  )}
                </Card>
              </motion.div>
            </motion.div>
        </>
      )}

      <AnimatePresence>
        {previewProduct && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewProduct(null)}
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
                onClick={() => setPreviewProduct(null)}
                aria-label="Fechar visualização do produto"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>

              {previewProduct.image_url ? (
                <img
                  src={joinUrl(API_BASE_URL, previewProduct.image_url)}
                  alt={previewProduct.name}
                  className="w-full max-h-[60vh] object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full max-h-[60vh] bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}

              <div className="p-6 md:p-8 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Visualização</p>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">{previewProduct.name}</h3>
                  <span className="text-2xl font-extrabold text-blue-700 whitespace-nowrap">{formatPrice(previewProduct.price)}</span>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{previewProduct.description}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => setPreviewProduct(null)}>Fechar</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
