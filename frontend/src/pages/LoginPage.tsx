import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

type Props = {
  onAuthenticated: () => void
}

export default function LoginPage({ onAuthenticated }: Props) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (email && password) {
      try {
        const response = await fetch('http://localhost:8080/public/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.token)
          onAuthenticated()
          navigate('/catalogos')
        } else {
          const data = await response.json()
          setError(data.error || 'Falha no login')
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor')
      }
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Bem-vindo de volta</h2>
        <p className="text-gray-500 text-base">Entre para gerenciar seus catálogos</p>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</label>
            <a href="#" className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">Esqueceu sua senha?</a>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors" aria-label="Mostrar senha">
              👁️
            </button>
          </div>
        </div>

        <button type="submit" className="bg-orange-500 text-white border-none py-3.5 rounded-lg font-semibold text-base cursor-pointer hover:bg-orange-600 transition-colors mt-2 shadow-lg shadow-orange-500/20">Entrar</button>

        <div className="text-center text-sm text-gray-500">
          Não tem uma conta? <Link to="/registro" className="text-orange-500 font-semibold hover:underline hover:text-orange-600 transition-colors">Cadastre-se</Link>
        </div>

      </form>
    </AuthLayout>
  )
}
