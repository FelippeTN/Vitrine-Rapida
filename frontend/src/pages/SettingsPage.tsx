import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Save, Store, Upload, Trash2, Headphones, Mail, MessageSquare } from 'lucide-react'
import { type User as UserType } from '@/components/layout/Header'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button, Input, Card, Toast } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { formatPhone } from '@/utils/format'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'
import { compressImage } from '@/utils/imageCompression'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface SettingsPageProps {
  user?: UserType | null
  onLogout?: () => void
  onUserUpdate?: () => void
}

export default function SettingsPage({ user, onLogout, onUserUpdate }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'support'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null)
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

  // Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

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

    // Store file type for later
    // Check type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Tipo de arquivo inválido. Use JPEG ou PNG' })
      return
    }


    try {

      const processedFile = await compressImage(file, { threshold: 10 * 1024 * 1024 })
      
      // Read file to data URL for cropping
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null)
        setIsCropping(true)
      })
      reader.readAsDataURL(processedFile)
    } catch (error) {
      console.error('Error compressing logo:', error)
      setMessage({ type: 'error', text: 'Erro ao processar imagem' })
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Progress State
  const [uploadProgress, setUploadProgress] = useState(0)

  async function uploadCroppedImage() {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      setIsUploadingLogo(true)
      // Do not close modal immediately to show progress
      // setIsCropping(false) 
      setMessage({ type: '', text: '' })
      setUploadProgress(0)

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedImage) {
        throw new Error('Erro ao cortar imagem')
      }

      const formData = new FormData()
      formData.append('logo', croppedImage, 'logo.jpg')

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const promise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            setUploadProgress(Math.round(percentComplete))
          }
        })

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              reject(JSON.parse(xhr.responseText))
            } catch (e) {
              reject({ error: `Erro ${xhr.status}: ${xhr.statusText}` })
              console.error(e);
            }
          }
        }

        xhr.onerror = () => reject({ error: 'Erro de rede' })

        xhr.open('POST', `${API_BASE_URL}/protected/me/logo`)
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)
        xhr.send(formData)
      })

      const data: any = await promise

      setLogoUrl(data.logo_url)
      onUserUpdate?.()
      setMessage({ type: 'success', text: 'Logo atualizada com sucesso!' })
      setIsCropping(false) // Close modal on success
      setImageSrc(null)
      setZoom(1)
      setCrop({ x: 0, y: 0 })

    } catch (error: any) {
      console.error("Upload error:", error)
      setMessage({ type: 'error', text: error.error || 'Erro ao fazer upload da logo' })
    } finally {
      setIsUploadingLogo(false)
      setUploadProgress(0)
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
        onUserUpdate?.()
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
      <div className="mb-6 text-center md:text-left">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie seus dados e preferências</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
              ? 'bg-[#e6f5f3] text-[#075E54]'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <User className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
              ? 'bg-[#e6f5f3] text-[#075E54]'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Lock className="w-4 h-4" />
            Segurança
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'support'
              ? 'bg-[#e6f5f3] text-[#075E54]'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Headphones className="w-4 h-4" />
            Suporte
          </button>

        </aside>

        {/* Content */}
        <div className="flex-1 w-full max-w-2xl">
          {message.text && (
            <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-[#e6f5f3] text-[#075E54]' : 'bg-red-50 text-red-700'
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#075E54] bg-[#e6f5f3] border border-[#25D366]/30 rounded-lg hover:bg-[#ccebe6] hover:border-[#25D366] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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

          {activeTab === 'support' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#e6f5f3] rounded-lg">
                      <Headphones className="w-6 h-6 text-[#075E54]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Central de Ajuda</h3>
                      <p className="text-sm text-gray-500">Estamos aqui para ajudar você</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Entre em contato via Email
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Tem alguma dúvida, encontrou um problema ou tem uma sugestão de melhoria? 
                        Envie um email para nossa equipe de suporte.
                      </p>
                       <p className="text-sm text-gray-600 mb-4">
                        Clique a baixo ou envie para esse email: vitrinerapida.suporte@gmail.com
                      </p>
                      <Button 
                        className="w-full sm:w-auto gap-2"
                        onClick={() => window.location.href = 'mailto:vitrinerapida.suporte@gmail.com'}
                      >
                        <Mail className="w-4 h-4" />
                        Enviar Email
                      </Button>
                    </div>

                    <div className="p-4 bg-[#e6f5f3]/50 rounded-xl border border-[#25D366]/20">
                      <h4 className="font-medium text-[#064e46] mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#25D366]" />
                        Sugestões de Melhoria
                      </h4>
                      <p className="text-sm text-[#064e46]">
                        Sua opinião é muito importante para nós! Se você tiver ideias de como podemos 
                        melhorar a Vitrine Rápida, não deixe de nos contar. Estamos sempre evoluindo 
                        para atender melhor suas necessidades.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}


        </div>
      </div>

      {/* Crop Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Ajustar Imagem</h3>
              <button
                onClick={() => { setIsCropping(false); setImageSrc(null); }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-64 sm:h-80 w-full bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels as any)}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Zoom</span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    disabled={isUploadingLogo}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#075E54] disabled:opacity-50"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Progress Bar */}
              {isUploadingLogo && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Enviando imagem...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#075E54] transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setIsCropping(false); setImageSrc(null); }}
                  className="flex-1"
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => void uploadCroppedImage()}
                  isLoading={isUploadingLogo}
                  className="flex-1"
                  type="button"
                >
                  Salvar e Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast
        message={toast?.message ?? ''}
        type={toast?.type}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </PageLayout>
  )
}
