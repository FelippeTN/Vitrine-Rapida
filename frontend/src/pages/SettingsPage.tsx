import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Save, Store, Upload, Trash2 } from 'lucide-react'
import { type User as UserType } from '@/components/layout/Header'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button, Input, Card, Toast } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { formatPhone } from '@/utils/format'

interface SettingsPageProps {
  user?: UserType | null
  onLogout?: () => void
}

export default function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null)
  const showToast = (message: string, type: 'warning' | 'error' | 'info' = 'error') => setToast({ message, type })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile Form State
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    number: '',
  })

  // Logo State
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Password Form State
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/protected/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProfile({
          username: data.username,
          email: data.email,
          number: formatPhone(data.number), // Format received number
        })
        if (data.logo_url) {
          setLogoUrl(data.logo_url)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
      const formatted = formatPhone(e.target.value)
      setProfile({ ...profile, number: formatted })
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Remove symbols before sending
      const cleanNumber = profile.number.replace(/\D/g, '')

      const response = await fetch(`${API_BASE_URL}/protected/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
             ...profile,
             number: cleanNumber 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao atualizar perfil' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/protected/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
            current_password: passwords.current_password,
            new_password: passwords.new_password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
        setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao alterar senha' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Tipo de arquivo inválido. Use JPEG ou PNG' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast(`A imagem "${file.name}" excede o limite de 2MB. Por favor, escolha uma imagem menor.`, 'error')
      return
    }

    setIsUploadingLogo(true)
    setMessage({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(`${API_BASE_URL}/protected/me/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setLogoUrl(data.logo_url)
        setMessage({ type: 'success', text: 'Logo atualizada com sucesso!' })
      } else if (response.status === 413) {
        showToast('A imagem é muito grande para ser processada pelo servidor. Por favor, use uma imagem menor (máx. 2MB).', 'error')
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao fazer upload da logo' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleDeleteLogo() {
    setIsUploadingLogo(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/protected/me/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setLogoUrl(null)
        setMessage({ type: 'success', text: 'Logo removida com sucesso!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao remover logo' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <PageLayout
      isAuthenticated={true}
      user={user}
      onLogout={onLogout}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie seus dados e preferências</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            Segurança
          </button>

        </aside>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
            {message.text && (
                <div className={`p-4 rounded-lg mb-6 text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <div className="p-6">
                  {/* Logo Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                      {logoUrl ? (
                        <img
                          src={`${API_BASE_URL}${logoUrl}`}
                          alt="Logo da loja"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-sm font-medium text-gray-700">Logo da Loja</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPEG ou PNG, máx. 2MB</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingLogo ? 'Enviando...' : logoUrl ? 'Alterar' : 'Enviar'}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          disabled={isUploadingLogo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações Pessoais</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input
                      label="Nome da Loja"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={profile.email}
                      disabled={true}
                      className="bg-gray-50"
                    />
                    <Input
                      label="WhatsApp"
                      value={profile.number}
                      onChange={handleNumberChange}
                      placeholder="(00) 00000-0000"
                    />
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" isLoading={isLoading} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Alterar Senha</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      value={profile.email}
                      readOnly
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <Input
                      label="Senha Atual"
                      type="password"
                      value={passwords.current_password}
                      onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                      autoComplete="current-password"
                    />
                    <Input
                      label="Nova Senha"
                      type="password"
                      value={passwords.new_password}
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                      autoComplete="new-password"
                    />
                    <Input
                      label="Confirmar Nova Senha"
                      type="password"
                      value={passwords.confirm_password}
                      onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                      autoComplete="new-password"
                    />
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" isLoading={isLoading} className="gap-2">
                        <Save className="w-4 h-4" />
                        Atualizar Senha
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}


        </div>
      </div>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </PageLayout>
  )
}
