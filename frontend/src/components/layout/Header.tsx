import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { Store, LogOut, User, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'

export interface HeaderProps {
  isAuthenticated?: boolean
  onLogout?: () => void
}

export function Header({ isAuthenticated, onLogout }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isPublicPage = location.pathname.startsWith('/c/')
  const isAuthPage = ['/login', '/registro', '/'].includes(location.pathname)

  function handleLogout() {
    onLogout?.()
    navigate('/')
  }

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo e Marca */}
        <Link 
          to={isAuthenticated ? '/catalogos' : '/'} 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <motion.div 
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200/50"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Store className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900 leading-tight">
              Vitrine Digital
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Catálogo Online
            </span>
          </div>
        </Link>

        {/* Navegação Central - apenas para usuários autenticados */}
        {isAuthenticated && !isPublicPage && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/catalogos" icon={<LayoutGrid className="w-4 h-4" />}>
              Minhas Vitrines
            </NavLink>
          </nav>
        )}

        {/* Ações do Usuário */}
        <div className="flex items-center gap-2">
          {isPublicPage ? (
            // Header para página pública - apenas logo
            <div className="text-xs text-gray-400">
              Vitrine compartilhada
            </div>
          ) : isAuthenticated ? (
            // Header para usuário autenticado
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-gray-200">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">Minha Conta</span>
                  <span className="text-[10px] text-gray-400">Logado</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </Button>
            </div>
          ) : !isAuthPage ? (
            // Header para visitante em página não-auth
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-gray-600"
              >
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/registro')}
              >
                Criar Conta
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.header>
  )
}

interface NavLinkProps {
  to: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function NavLink({ to, icon, children }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
  
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {icon}
      {children}
    </Link>
  )
}
