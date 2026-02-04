import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button, Input } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { isValidEmail, normalizeEmail } from '@/utils/sanitize'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    const normalizedEmail = normalizeEmail(email)
    
    if (!normalizedEmail) {
      setError('Preencha o email')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Formato de email inválido')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/public/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(data.message)
      } else {
        setError(data.error || 'Erro ao processar solicitação')
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
        <p className="text-gray-600">Informe seu email para receber as instruções</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {message}
        </div>
      )}

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
          disabled={isLoading || !!message}
          maxLength={254}
          autoComplete="email"
        />

        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2" disabled={!!message}>
          Enviar instruções
        </Button>

        <p className="text-center text-sm text-gray-600">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
