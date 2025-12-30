import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, ImageIcon, Trash2, Pencil, Save, X, Share2 } from 'lucide-react'

import { collectionsService, isUnauthorized, productsService } from '../api'
import { API_BASE_URL, joinUrl } from '../api/config'
import type { Collection, Product } from '../api'
import { PageLayout } from '../components/layout'
import { Button, Card, Input } from '../components/ui'
import { formatPrice } from '../utils/format'

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
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
        return
      }
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)

    const trimmedName = name.trim()
    const trimmedDesc = description.trim()
    const parsedPrice = Number(String(price).replace(',', '.'))

    if (!trimmedName) { setSaveError('Digite o nome do produto'); return }
    if (!trimmedDesc) { setSaveError('Digite a descrição'); return }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) { setSaveError('Preço inválido'); return }

    try {
      setIsSaving(true)
      await productsService.create({
        name: trimmedName, description: trimmedDesc, price: parsedPrice,
        collection_id: collectionId, image,
      })
      setName(''); setDescription(''); setPrice(''); setImage(null)
      await load()
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }); return }
      setSaveError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCollection() {
    if (!collection || !window.confirm('Apagar vitrine e todos os produtos?')) return
    try {
      await collectionsService.remove(collection.id)
      navigate('/catalogos', { replace: true })
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) }
    }
  }

  async function handleUpdateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!collection || !collectionName.trim()) return

    try {
      setIsUpdatingCollection(true)
      await collectionsService.update(collection.id, {
        name: collectionName.trim(),
        description: collectionDescription.trim() || undefined,
      })
      setIsEditingCollection(false)
      await load()
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) }
    } finally {
      setIsUpdatingCollection(false)
    }
  }

  async function handleShareCollection() {
    if (!collection) return
    try {
      const res = await collectionsService.share(collection.id)
      const url = `${window.location.origin}/c/${res.share_token}`
      await navigator.clipboard.writeText(url).catch(() => {})
      window.prompt('Link copiado:', url)
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) }
    }
  }

  function startEditProduct(p: Product) {
    setEditingProductId(p.id)
    setEditProductName(p.name)
    setEditProductDescription(p.description)
    setEditProductPrice(String(p.price))
    setEditProductImage(null)
  }

  function cancelEditProduct() {
    setEditingProductId(null)
  }

  async function saveProductEdit(id: number) {
    const trimmedName = editProductName.trim()
    const trimmedDesc = editProductDescription.trim()
    const parsedPrice = Number(String(editProductPrice).replace(',', '.'))

    if (!trimmedName || !trimmedDesc || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return

    try {
      setIsUpdatingProduct(true)
      await productsService.update(id, {
        name: trimmedName, description: trimmedDesc, price: parsedPrice,
        collection_id: collectionId, image: editProductImage,
      })
      cancelEditProduct()
      await load()
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) }
    } finally {
      setIsUpdatingProduct(false)
    }
  }

  async function deleteProduct(id: number) {
    if (!window.confirm('Apagar produto?')) return
    try {
      await productsService.remove(id)
      if (editingProductId === id) cancelEditProduct()
      await load()
    } catch (err) {
      if (isUnauthorized(err)) { onLogout(); navigate('/login', { replace: true }) }
    }
  }

  return (
    <PageLayout
      title={collection?.name || 'Vitrine'}
      subtitle="Gerenciar produtos"
      onBack={() => navigate('/catalogos')}
      onLogout={() => { onLogout(); navigate('/') }}
    >
      {isLoading && <div className="text-center py-12 text-gray-500">Carregando...</div>}
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
                <Button variant="ghost" size="sm" onClick={() => void handleShareCollection()}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingCollection(!isEditingCollection)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="danger" size="sm" onClick={() => void handleDeleteCollection()}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isEditingCollection && (
              <form className="flex gap-3 mt-4 pt-4 border-t border-gray-200" onSubmit={handleUpdateCollection}>
                <Input placeholder="Nome" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className="flex-1" />
                <Input placeholder="Descrição" value={collectionDescription} onChange={(e) => setCollectionDescription(e.target.value)} className="flex-1" />
                <Button type="submit" isLoading={isUpdatingCollection}>Salvar</Button>
                <Button variant="ghost" type="button" onClick={() => setIsEditingCollection(false)}><X className="w-4 h-4" /></Button>
              </form>
            )}
          </Card>

          {/* Add product */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-medium text-gray-900">Adicionar produto</h2>
            </div>

            <form className="flex flex-col md:flex-row gap-3" onSubmit={handleCreateProduct}>
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} className="flex-1" />
              <Input placeholder="Preço (ex: 49.90)" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isSaving} className="w-32" />
              <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving} className="flex-1" />
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 truncate max-w-[80px]">{image ? image.name : 'Imagem'}</span>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
              <Button type="submit" isLoading={isSaving}><Plus className="w-4 h-4" /></Button>
            </form>
            {saveError && <p className="text-sm text-red-600 mt-3">{saveError}</p>}
          </Card>

          {/* Products */}
          <div className="mb-4">
            <h2 className="font-medium text-gray-900">Produtos ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum produto. Adicione acima!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id} variant="bordered">
                  {editingProductId === p.id ? (
                    <div className="space-y-3">
                      <Input placeholder="Nome" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} />
                      <Input placeholder="Descrição" value={editProductDescription} onChange={(e) => setEditProductDescription(e.target.value)} />
                      <Input placeholder="Preço" value={editProductPrice} onChange={(e) => setEditProductPrice(e.target.value)} />
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{editProductImage ? editProductImage.name : 'Alterar imagem'}</span>
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
                        <img src={joinUrl(API_BASE_URL, p.image_url)} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{p.name}</h3>
                        <span className="font-semibold text-blue-600">{formatPrice(p.price)}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditProduct(p)} className="flex-1">
                          <Pencil className="w-4 h-4 mr-1" />Editar
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => void deleteProduct(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
