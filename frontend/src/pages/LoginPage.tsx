import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { Button, Input } from '../components/ui'

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

    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8080/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        onAuthenticated()
        navigate('/catalogos')
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
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />

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
