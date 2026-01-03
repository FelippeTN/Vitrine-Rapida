import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Share2, Pencil, Trash2, ExternalLink, X } from 'lucide-react'

import { collectionsService, isUnauthorized } from '@/api'
import { useCatalogs, type CatalogCard } from '@/hooks/useCatalogs'
import { PageLayout, staggerContainer, staggerItem } from '@/components/layout'
import { Button, Card, Badge, Input } from '@/components/ui'

interface CatalogPageProps {
  onLogout: () => void
}

export default function CatalogPage({ onLogout }: CatalogPageProps) {
  const navigate = useNavigate()
  const { catalogs, isLoading, error, errorMessage, reload } = useCatalogs()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const canCreate = useMemo(() => catalogs.length < 5, [catalogs.length])

  function handleLogout() {
    onLogout()
    navigate('/')
  }

  useEffect(() => {
    if (!error) return
    if (isUnauthorized(error)) {
      onLogout()
      navigate('/login', { replace: true })
    }
  }, [error, navigate, onLogout])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setCreateError('Digite um nome para a vitrine')
      return
    }
    if (!canCreate) {
      setCreateError('Limite de 5 vitrines atingido')
      return
    }

    try {
      setIsCreating(true)
      await collectionsService.create({ name: trimmedName, description: description.trim() || undefined })
      setName('')
      setDescription('')
      await reload()
      setShowCreateForm(false)
    } catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
        return
      }
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar vitrine')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(catalog: CatalogCard) {
    setUpdateError(null)
    setEditingId(catalog.id)
    setEditName(catalog.name)
    setEditDescription(catalog.description === 'Sem descrição' ? '' : catalog.description)
  }

  function cancelEdit() {
    setUpdateError(null)
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setUpdateError(null)
    const trimmedName = editName.trim()
    if (!trimmedName) {
      setUpdateError('Digite um nome')
      return
    }

    try {
      setIsUpdating(true)
      await collectionsService.update(Number(id), {
        name: trimmedName,
        description: editDescription.trim() || undefined,
      })
      cancelEdit()
      await reload()
    } catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
        return
      }
      setUpdateError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Apagar esta vitrine e todos os produtos?')) return

    try {
      await collectionsService.remove(Number(id))
      if (editingId === id) cancelEdit()
      await reload()
    } catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
      }
    }
  }

  async function handleShare(id: string) {
    try {
      const res = await collectionsService.share(Number(id))
      const url = `${window.location.origin}/c/${res.share_token}`
      await navigator.clipboard.writeText(url).catch(() => {})
      window.prompt('Link copiado:', url)
    } catch (err) {
      if (isUnauthorized(err)) {
        onLogout()
        navigate('/login', { replace: true })
      }
    }
  }

  return (
    <PageLayout isAuthenticated={true} onLogout={handleLogout}>
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Minhas vitrines</h1>
        <p className="text-gray-600 mt-1">Crie e gerencie seus catálogos de produtos</p>
      </motion.div>



      {/* Loading */}
      {isLoading && (
        <motion.div 
          className="text-center py-12 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Carregando vitrines...
        </motion.div>
      )}

      {/* Error */}
      {!isLoading && errorMessage && (
        <motion.div 
          className="text-center py-12 text-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Empty */}
      {/* Grid with Create Card and Catalogs */}
      {!isLoading && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >


          {catalogs.map((c) => (
            <motion.div key={c.id} variants={staggerItem} className="h-full">
              <Card variant="bordered" animate={false} className="h-full flex flex-col min-h-[220px]">
                {editingId === c.id ? (
                  <div className="space-y-3 flex-1">
                    <Input
                      placeholder="Nome"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={isUpdating}
                    />
                    <Input
                      placeholder="Descrição"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      disabled={isUpdating}
                    />
                    {updateError && <p className="text-sm text-red-600">{updateError}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void saveEdit(c.id)} isLoading={isUpdating}>
                        Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{c.name}</h3>
                      <Badge>{c.items} itens</Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[40px] flex-1">{c.description}</p>
                    <p className="text-xs text-gray-400 mb-4">{c.updatedAtLabel}</p>

                    <div className="flex gap-2 mt-auto">
                      <Button size="sm" onClick={() => navigate(`/catalogos/${c.id}`)} className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleShare(c.id)}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => void handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}

          {/* Create New Card */}
          {canCreate && (
            <motion.div variants={staggerItem} className="h-full">
              <Card 
                className={`h-full flex flex-col justify-center relative ${!showCreateForm ? 'min-h-[220px] items-center cursor-pointer hover:bg-gray-50 border-dashed border-2' : ''}`}
                onClick={!showCreateForm ? () => setShowCreateForm(true) : undefined}
                animate={false}
              >
                {!showCreateForm ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-medium">Nova Vitrine</span>
                  </div>
                ) : (
                  <div className="w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowCreateForm(false); }}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="mb-4">
                      <h2 className="font-medium text-gray-900">Nova vitrine</h2>
                      <p className="text-sm text-gray-500">{catalogs.length}/5 criadas</p>
                    </div>

                    <form className="flex flex-col gap-3" onSubmit={handleCreate}>
                      <Input
                        placeholder="Nome da vitrine"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading || isCreating}
                        autoFocus
                      />
                      <Input
                        placeholder="Descrição (opcional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading || isCreating}
                      />
                      <Button type="submit" disabled={isLoading || isCreating} isLoading={isCreating}>
                        Criar vitrine
                      </Button>
                    </form>
                    {createError && <p className="text-sm text-red-600 mt-2">{createError}</p>}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </PageLayout>
  )
}
