import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button, Input } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { isValidEmail, normalizeEmail } from '@/utils/sanitize'

interface LoginPageProps {
  onAuthenticated: () => void
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate inputs
    const normalizedEmail = normalizeEmail(email)
    
    if (!normalizedEmail || !password) {
      setError('Preencha todos os campos')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Formato de email inválido')
      return
    }

    if (password.length > 128) {
      setError('Senha muito longa')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/public/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        onAuthenticated()
        navigate('/catalogos')
      } else if (response.status === 429) {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        const data = await response.json()
        setError(data.error || 'Email ou senha inválidos')
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
        <p className="text-gray-600">Entre para gerenciar suas vitrines</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          maxLength={254}
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          maxLength={128}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Entrar
        </Button>

        <p className="text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <Link to="/registro" className="text-blue-600 font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
