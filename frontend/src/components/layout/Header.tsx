import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { LogOut, User as UserIcon, LayoutGrid, Crown, Settings, ChevronDown, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import logoSvg from '@/assets/logo.png'

export interface User {
  id: number
  username: string
  email: string
  number: string
  plan_id: number
}

export interface HeaderProps {
  isAuthenticated?: boolean
  onLogout?: () => void
  user?: User | null
}

export function Header({ isAuthenticated, onLogout, user }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isPublicPage = location.pathname.startsWith('/c/')
  const isAuthPage = ['/login', '/registro', '/'].includes(location.pathname)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
            className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-blue-200/50"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src={logoSvg} alt="Vitrine Rápida Logo" className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900 leading-tight">
              Vitrine Rápida
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Catálogo Digital
            </span>
          </div>
        </Link>

        {/* Navegação Central - apenas para usuários autenticados */}
        {isAuthenticated && !isPublicPage && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/catalogos" icon={<LayoutGrid className="w-4 h-4" />}>
              Minhas Vitrines
            </NavLink>
            <NavLink to="/planos" icon={<Crown className="w-4 h-4" />}>
              Planos
            </NavLink>
          </nav>
        )}

        {/* Ações do Usuário */}
        <div className="flex items-center gap-2">
          {/* Botão hamburger para mobile - apenas para usuários autenticados */}
          {isAuthenticated && !isPublicPage && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu de navegação"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {isPublicPage ? (
            <div className="text-xs text-gray-400">
              Vitrine compartilhada
            </div>
          ) : isAuthenticated ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200 font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.username || 'Minha Conta'}
                  </span>
                  <span className="text-[10px] text-gray-400">Logado</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-medium text-gray-900 truncate">{user?.username || 'Usuário'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/configuracoes')
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Configurações
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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

      {/* Menu Mobile */}
      <AnimatePresence>
        {isAuthenticated && !isPublicPage && isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
          >
            <nav className="px-4 py-3 space-y-1">
              {/* Informações do usuário */}
              <div className="px-3 py-3 mb-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200 font-medium">
                    {user?.username?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.username || 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Links de navegação */}
              <Link
                to="/catalogos"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutGrid className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Minhas Vitrines</span>
              </Link>

              <Link
                to="/planos"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Crown className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Planos</span>
              </Link>

              <Link
                to="/configuracoes"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="font-medium">Configurações</span>
              </Link>

              <div className="border-t border-gray-100 my-2" />

              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
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
