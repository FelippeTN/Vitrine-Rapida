import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

type Props = {
  onAuthenticated: () => void
}

export default function RegisterPage({ onAuthenticated }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name && email && password) {
      onAuthenticated()
      navigate('/catalogos')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Crie sua conta</h2>
        <p className="text-gray-500 text-base">Comece a vender mais com seu catálogo digital</p>
      </div>

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

        <div className="flex items-center text-center text-gray-500 text-sm my-2 before:flex-1 before:border-b before:border-gray-200 before:mr-4 after:flex-1 after:border-b after:border-gray-200 after:ml-4">
          <span>ou</span>
        </div>

        <button type="button" className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          <span className="text-lg">💬</span> Cadastro com WhatsApp
        </button>
      </form>
    </AuthLayout>
  )
}
