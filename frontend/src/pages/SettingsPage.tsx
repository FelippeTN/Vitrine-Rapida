import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Save } from 'lucide-react'
import { type User as UserType } from '@/components/layout/Header'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button, Input, Card } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { formatPhone } from '@/utils/format'

interface SettingsPageProps {
  user?: UserType | null
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Profile Form State
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    number: '',
  })

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

  return (
    <PageLayout
      isAuthenticated={true}
      user={user}
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
                    <Input
                      label="Senha Atual"
                      type="password"
                      value={passwords.current_password}
                      onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    />
                    <Input
                      label="Nova Senha"
                      type="password"
                      value={passwords.new_password}
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    />
                    <Input
                      label="Confirmar Nova Senha"
                      type="password"
                      value={passwords.confirm_password}
                      onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
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
    </PageLayout>
  )
}
