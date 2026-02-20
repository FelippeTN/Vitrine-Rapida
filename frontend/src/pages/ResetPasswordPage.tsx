import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button, Input } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Token inválido ou não fornecido.')
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Token inválido.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Preencha todos os campos')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/public/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(data.message)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.error || 'Erro ao redefinir senha')
      }
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
        <p className="text-gray-600">Crie uma nova senha para sua conta</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {message}
          <p className="mt-2 text-xs">Você será redirecionado para o login em instantes...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Nova Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading || !!message || !token}
          maxLength={128}
          autoComplete="new-password"
        />

        <Input
          label="Confirmar Nova Senha"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading || !!message || !token}
          maxLength={128}
          autoComplete="new-password"
        />

        <Button 
          type="submit" 
          size="lg" 
          isLoading={isLoading} 
          className="w-full mt-2" 
          disabled={!!message || !token}
        >
          Redefinir Senha
        </Button>

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-[#075E54] font-medium hover:underline">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
