import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Share2, Pencil, Trash2, ExternalLink, Package } from 'lucide-react'

import { collectionsService, isUnauthorized } from '../api'
import { useCatalogs, type CatalogCard } from '../hooks/useCatalogs'
import { PageLayout, staggerContainer, staggerItem } from '../components/layout'
import { Button, Card, Badge, Input } from '../components/ui'

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
    <PageLayout title="Vitrine Digital" subtitle="Minhas vitrines" onLogout={handleLogout}>
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

      {/* Create form */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900">Nova vitrine</h2>
            <p className="text-sm text-gray-500">{catalogs.length}/5 vitrines criadas</p>
          </div>
        </div>

        <form className="flex flex-col md:flex-row gap-3" onSubmit={handleCreate}>
          <Input
            placeholder="Nome da vitrine"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading || isCreating || !canCreate}
            className="flex-1"
          />
          <Input
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading || isCreating || !canCreate}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || isCreating || !canCreate} isLoading={isCreating}>
            Criar vitrine
          </Button>
        </form>

        {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
      </Card>

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
      {!isLoading && !errorMessage && catalogs.length === 0 && (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Nenhuma vitrine</h3>
          <p className="text-gray-500 text-sm">Crie sua primeira vitrine acima</p>
        </motion.div>
      )}

      {/* Grid with stagger */}
      {!isLoading && catalogs.length > 0 && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {catalogs.map((c) => (
            <motion.div key={c.id} variants={staggerItem}>
              <Card variant="bordered" animate={false}>
                {editingId === c.id ? (
                  <div className="space-y-3">
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
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{c.name}</h3>
                      <Badge>{c.items} itens</Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[40px]">{c.description}</p>
                    <p className="text-xs text-gray-400 mb-4">{c.updatedAtLabel}</p>

                    <div className="flex gap-2">
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
                  </>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageLayout>
  )
}
