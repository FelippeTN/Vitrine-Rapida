import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button, Input } from '@/components/ui'
import { API_BASE_URL } from '@/api/config'
import { formatPhone } from '@/utils/format'
import { 
  isValidEmail, 
  isValidUsername, 
  isValidPassword, 
  isValidPhone,
  normalizeEmail,
  cleanPhone,
  sanitizeInput
} from '@/utils/sanitize'

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

    // Sanitize and validate inputs
    const sanitizedName = sanitizeInput(name, 50)
    const normalizedEmail = normalizeEmail(email)
    const cleanNumber = cleanPhone(number)

    if (!sanitizedName || !normalizedEmail || !cleanNumber || !password) {
      setError('Preencha todos os campos')
      return
    }

    if (!isValidUsername(sanitizedName)) {
      setError('Nome da loja inválido. Use apenas letras, números e espaços (2-50 caracteres).')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Formato de email inválido')
      return
    }

    if (!isValidPhone(cleanNumber)) {
      setError('Número de telefone inválido (deve ter 10-11 dígitos)')
      return
    }

    if (!isValidPassword(password)) {
      setError('Senha deve ter entre 6 e 128 caracteres')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: sanitizedName, 
          email: normalizedEmail, 
          number: cleanNumber, 
          password 
        }),
      })

      if (response.ok) {
        navigate('/login')
      } else if (response.status === 429) {
        setError('Muitas tentativas de registro. Tente novamente mais tarde.')
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

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only allow letters, numbers, accents and spaces
    const value = e.target.value
    if (value === '' || /^[a-zA-Z0-9À-ÿ\s]*$/.test(value)) {
      setName(value)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar sua conta</h2>
        <p className="text-gray-600">Comece a usar sua vitrine rápida</p>
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
          onChange={handleNameChange}
          disabled={isLoading}
          maxLength={50}
          autoComplete="organization"
        />

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
          label="WhatsApp"
          type="text"
          placeholder="(99) 99999-9999"
          value={number}
          onChange={handleNumberChange}
          disabled={isLoading}
          maxLength={15}
          autoComplete="tel"
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          maxLength={128}
          autoComplete="new-password"
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
