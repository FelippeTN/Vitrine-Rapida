import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button, Input } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'

import { formatPhone } from '@/utils/format'

interface RegisterPageProps {
  onAuthenticated: () => void
}

export default function RegisterPage(_: RegisterPageProps) {
  void _
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name || !email || !number || !password) {
      setError('Preencha todos os campos')
      return
    }

    try {
      setIsLoading(true)
      const cleanNumber = number.replace(/\D/g, '')

      const response = await fetch(`${API_BASE_URL}/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, number: cleanNumber, password }),
      })

      if (response.ok) {
        navigate('/login')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar conta')
      }
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNumber(formatPhone(e.target.value))
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar sua conta</h2>
        <p className="text-gray-600">Comece a usar sua vitrine digital</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Nome da loja"
          type="text"
          placeholder="Ex: Minha Loja"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="WhatsApp"
          type="text"
          placeholder="(99) 99999-9999"
          value={number}
          onChange={handleNumberChange}
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
          Criar conta grátis
        </Button>

        <p className="text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
