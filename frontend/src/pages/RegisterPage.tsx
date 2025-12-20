import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

type Props = {
  onAuthenticated: () => void
}

const apiUrl = 'http://localhost:8080/'

export default function RegisterPage({ onAuthenticated }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name && email && number && password) {
      try {
        const response = await fetch(`${apiUrl}public/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: name, email, number, password }),
        })

        if (response.ok) {
          navigate('/login')
        } else {
          const data = await response.json()
          setError(data.error || 'Falha no registro')
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor')
      }
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Crie sua conta</h2>
        <p className="text-gray-500 text-base">Comece a vender mais com seu catálogo digital</p>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-semibold text-gray-700">Nome da loja</label>
          <input
            id="name"
            type="text"
            placeholder="Ex: Minha Loja Incrível"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
          />
        </div>

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
          <label htmlFor="number" className="text-sm font-semibold text-gray-700">Número</label>
          <input
            id="number"
            type="text"
            placeholder="(99) 99999-9999"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</label>
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>

        <button type="submit" className="bg-orange-500 text-white border-none py-3.5 rounded-lg font-semibold text-base cursor-pointer hover:bg-orange-600 transition-colors mt-2 shadow-lg shadow-orange-500/20">Criar conta grátis</button>

        <div className="text-center text-sm text-gray-500">
          Já tem uma conta? <Link to="/login" className="text-orange-500 font-semibold hover:underline hover:text-orange-600 transition-colors">Entrar</Link>
        </div>

      </form>
    </AuthLayout>
  )
}
