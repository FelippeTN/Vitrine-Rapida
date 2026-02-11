import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ImageIcon, Trash2, Pencil, Save, X, Share2, ChevronLeft, ChevronRight } from 'lucide-react'

import { collectionsService, isUnauthorized, productsService, ApiError } from '@/api'
import { API_BASE_URL, joinUrl } from '@/api/config'
import type { Collection, Product, UpgradeError } from '@/api'
import { PageLayout, staggerContainer, staggerItem } from '@/components/layout'
import { type User } from '@/components/layout/Header'
import { Button, Card, Input, UpgradeModal, ConfirmModal, ShareModal, Toast } from '@/components/ui'
import { formatPrice, formatCurrencyInput, parseCurrencyInput } from '@/utils/format'

interface CollectionPageProps {
  onLogout: () => void
  user: User | null
}

export default function CollectionPage({ onLogout, user }: CollectionPageProps) {
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

  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [editProductDescription, setEditProductDescription] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')

  const [editProductSizes, setEditProductSizes] = useState<string[]>([])
  const [editProductNewImages, setEditProductNewImages] = useState<File[]>([])
  const [editProductDeleteImageIds, setEditProductDeleteImageIds] = useState<number[]>([])

  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeError | null>(null)



  // Confirmation & Share Modals
  const [deleteCollectionConfirmation, setDeleteCollectionConfirmation] = useState(false)
  const [deleteProductConfirmation, setDeleteProductConfirmation] = useState<{ id: number } | null>(null)
  const [shareModal, setShareModal] = useState<{ url: string } | null>(null)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null)
  const showToast = (message: string, type: 'warning' | 'error' | 'info' = 'warning') => setToast({ message, type })

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
      await productsService.create({
        name: trimmedName,
        description: trimmedDesc,
        price: parsedPrice,

        sizes: selectedSizes.length > 0 ? selectedSizes.join(',') : undefined,
        collection_id: collectionId,
        images: images.length > 0 ? images : undefined
      })
      setName(''); setDescription(''); setPrice(''); setSelectedSizes([]); setImages([])

      await load()
      setShowCreateForm(false)
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }); return }

      if (err instanceof ApiError && err.status === 403) {
        const body = err.body as UpgradeError
        if (body?.upgrade_required) {
          setUpgradeInfo(body)
          setShowUpgradeModal(true)
          setShowCreateForm(false)
          return
        }
      }
      if (err instanceof ApiError && err.status === 413) {
        showToast('Uma ou mais imagens são muito grandes para serem processadas pelo servidor. Por favor, use imagens menores (máx. 10MB cada).', 'error')
        return
      }

      setSaveError(err instanceof Error ? err.message : 'Erro')
    } finally { setIsSaving(false) }
  }

  async function handleDeleteCollection() {
    if (!collection) return
    try {
      await collectionsService.remove(collection.id)
      navigate('/catalogos', { replace: true })
    }
    catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
      }
    }
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
      setShareModal({ url })
    } catch (err) { if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) } }
  }

  function startEditProduct(p: Product) {
    setEditingProductId(p.id)
    setEditProductName(p.name)
    setEditProductDescription(p.description)
    setEditProductPrice(formatPrice(p.price))

    setEditProductSizes(p.sizes ? p.sizes.split(',') : [])
    setEditProductNewImages([])
    setEditProductDeleteImageIds([])
  }
  function cancelEditProduct() {
    setEditingProductId(null)
    setEditProductSizes([])
    setEditProductNewImages([])
    setEditProductDeleteImageIds([])
  }

  async function saveProductEdit(id: number) {
    const trimmedName = editProductName.trim()
    const trimmedDesc = editProductDescription.trim()
    const parsedPrice = parseCurrencyInput(editProductPrice)
    if (!trimmedName || !trimmedDesc || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return
    try {
      setIsUpdatingProduct(true)
      await productsService.update(id, {
        name: trimmedName,
        description: trimmedDesc,
        price: parsedPrice,

        sizes: editProductSizes.join(','),
        collection_id: collectionId,
        images: editProductNewImages.length > 0 ? editProductNewImages : undefined,
        delete_image_ids: editProductDeleteImageIds.length > 0 ? editProductDeleteImageIds : undefined
      })
      cancelEditProduct(); await load()
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }); return }
      if (err instanceof ApiError && err.status === 413) {
        showToast('Uma ou mais imagens são muito grandes para serem processadas pelo servidor. Por favor, use imagens menores (máx. 10MB cada).', 'error')
        return
      }
    }
    finally { setIsUpdatingProduct(false) }
  }

  function handleDeleteImageFromEdit(imageId: number) {
    setEditProductDeleteImageIds(prev => [...prev, imageId])
  }

  const MAX_IMAGES_PER_PRODUCT = 3

  function handleAddImagesToCreate(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`A imagem ${file.name} excede o limite de 10MB.`, 'error')
        return false
      }
      return true
    })
    
    setImages(prev => {
      const remaining = MAX_IMAGES_PER_PRODUCT - prev.length
      if (remaining <= 0) {
        showToast(`Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`, 'warning')
        return prev
      }
      if (validFiles.length > remaining) {
        showToast(`Você pode adicionar mais ${remaining} imagem(ns). Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`, 'warning')
        return [...prev, ...validFiles.slice(0, remaining)]
      }
      return [...prev, ...validFiles]
    })
  }

  function handleRemoveImageFromCreate(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddImagesToEdit(files: FileList | null, product: Product) {
    if (!files) return
    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`A imagem ${file.name} excede o limite de 10MB.`, 'error')
        return false
      }
      return true
    })
    // Calculate current image count (existing images minus deleted ones, plus new ones already added)
    const existingImages = (product.images || []).filter(img => !editProductDeleteImageIds.includes(img.id)).length
    setEditProductNewImages(prev => {
      const currentTotal = existingImages + prev.length
      const remaining = MAX_IMAGES_PER_PRODUCT - currentTotal
      if (remaining <= 0) {
        showToast(`Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`, 'warning')
        return prev
      }
      if (validFiles.length > remaining) {
        showToast(`Você pode adicionar mais ${remaining} imagem(ns). Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`, 'warning')
        return [...prev, ...validFiles.slice(0, remaining)]
      }
      return [...prev, ...validFiles]
    })
  }

  function handleRemoveNewImageFromEdit(index: number) {
    setEditProductNewImages(prev => prev.filter((_, i) => i !== index))
  }

  function getProductImages(p: Product): string[] {
    if (p.images && p.images.length > 0) {
      return p.images.sort((a, b) => a.position - b.position).map(img => img.image_url)
    }
    if (p.image_url) {
      return [p.image_url]
    }
    return []
  }

  function confirmDeleteProduct(id: number) {
    setDeleteProductConfirmation({ id })
  }

  async function deleteProduct() {
    if (!deleteProductConfirmation) return
    const { id } = deleteProductConfirmation

    try {
      await productsService.remove(id)
      if (editingProductId === id) cancelEditProduct()
      await load()
      setDeleteProductConfirmation(null)
    }
    catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
      }
    }
  }

  return (
    <PageLayout isAuthenticated={true} onLogout={() => { onLogout(); navigate('/') }} user={user}>
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
                <Button variant="danger" size="sm" onClick={() => setDeleteCollectionConfirmation(true)}><Trash2 className="w-4 h-4" /></Button>
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


                      {/* Seleção de Tamanhos */}
                      <div className="space-y-2">
                        <span className="text-sm text-gray-600">Tamanhos disponíveis:</span>
                        <div className="flex flex-wrap gap-2">
                          {['P', 'M', 'G', 'GG'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setEditProductSizes(prev =>
                                  prev.includes(size)
                                    ? prev.filter(s => s !== size)
                                    : [...prev, size]
                                )
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${editProductSizes.includes(size)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Existing images */}
                      {p.images && p.images.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-gray-600">Imagens atuais:</span>
                          <div className="flex flex-wrap gap-2">
                            {p.images
                              .filter(img => !editProductDeleteImageIds.includes(img.id))
                              .map((img) => (
                                <div key={img.id} className="relative group">
                                  <img
                                    src={joinUrl(API_BASE_URL, img.image_url)}
                                    alt=""
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImageFromEdit(img.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* New images to add */}
                      {editProductNewImages.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-gray-600">Novas imagens:</span>
                          <div className="flex flex-wrap gap-2">
                            {editProductNewImages.map((file, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt=""
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNewImageFromEdit(idx)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Adicionar imagens</span>
                        <input type="file" accept="image/*" multiple onChange={(e) => handleAddImagesToEdit(e.target.files, p)} className="hidden" />
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void saveProductEdit(p.id)} isLoading={isUpdatingProduct}><Save className="w-4 h-4 mr-1" />Salvar</Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditProduct}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const productImages = getProductImages(p)
                        if (productImages.length > 0) {
                          return (
                            <div className="relative">
                              <motion.img
                                src={joinUrl(API_BASE_URL, productImages[0])}
                                alt={p.name}
                                className="w-full h-40 object-cover rounded-lg mb-3 cursor-zoom-in"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                onClick={() => { setPreviewProduct(p); setPreviewImageIndex(0); }}
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
                            <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 text-gray-300" />
                            </div>
                          )
                        }
                      })()}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{p.name}</h3>
                        <span className="font-semibold text-blue-600">{formatPrice(p.price)}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditProduct(p)} className="flex-1"><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => confirmDeleteProduct(p.id)}><Trash2 className="w-4 h-4" /></Button>
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

                      {/* Seleção de Tamanhos */}
                      <div className="space-y-2">
                        <span className="text-sm text-gray-600">Tamanhos disponíveis:</span>
                        <div className="flex flex-wrap gap-2">
                          {['P', 'M', 'G', 'GG'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(prev =>
                                  prev.includes(size)
                                    ? prev.filter(s => s !== size)
                                    : [...prev, size]
                                )
                              }}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSizes.includes(size)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview selected images */}
                      {images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {images.map((file, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="w-14 h-14 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImageFromCreate(idx)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 truncate">
                          {images.length > 0 ? `${images.length} imagem(ns)` : 'Adicionar imagens'}
                        </span>
                        <input type="file" accept="image/*" multiple onChange={(e) => handleAddImagesToCreate(e.target.files)} className="hidden" />
                      </label>
                      <Button type="submit" isLoading={isSaving} className="w-full">
                        Salvar
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

              {(() => {
                const productImages = getProductImages(previewProduct)
                const currentImage = productImages[previewImageIndex] || productImages[0]

                return (
                  <div className="relative">
                    {currentImage ? (
                      <img
                        src={joinUrl(API_BASE_URL, currentImage)}
                        alt={previewProduct.name}
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
                          onClick={() => setPreviewImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                          aria-label="Imagem anterior"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                          onClick={() => setPreviewImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                          aria-label="Próxima imagem"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>

                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {productImages.map((_, idx) => (
                            <button
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-colors ${idx === previewImageIndex ? 'bg-blue-600' : 'bg-white/60'}`}
                              onClick={() => setPreviewImageIndex(idx)}
                              aria-label={`Ver imagem ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              <div className="p-6 md:p-8 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Visualização</p>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">{previewProduct.name}</h3>
                  <span className="text-2xl font-extrabold text-blue-700 whitespace-nowrap">{formatPrice(previewProduct.price)}</span>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{previewProduct.description}</p>

                {/* Tamanhos disponíveis */}
                {previewProduct.sizes && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Tamanhos disponíveis:</span>
                    <div className="flex flex-wrap gap-2">
                      {previewProduct.sizes.split(',').map((size) => (
                        <span
                          key={size}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100"
                        >
                          {size.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => setPreviewProduct(null)}>Fechar</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="product"
        currentCount={upgradeInfo?.current_count ?? 0}
        limit={upgradeInfo?.limit ?? 0}
        planName={upgradeInfo?.plan_name ?? ''}
      />

      <ConfirmModal
        isOpen={deleteCollectionConfirmation}
        onClose={() => setDeleteCollectionConfirmation(false)}
        onConfirm={() => void handleDeleteCollection()}
        title="Apagar vitrine"
        description="Tem certeza que deseja apagar esta vitrine? Todos os produtos serão perdidos."
        confirmText="Apagar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!deleteProductConfirmation}
        onClose={() => setDeleteProductConfirmation(null)}
        onConfirm={() => void deleteProduct()}
        title="Apagar produto"
        description="Tem certeza que deseja apagar este produto?"
        confirmText="Apagar"
        variant="danger"
      />

      <ShareModal
        isOpen={!!shareModal}
        onClose={() => setShareModal(null)}
        url={shareModal?.url ?? ''}
        title="Compartilhar Vitrine"
      />

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </PageLayout>
  )
}
