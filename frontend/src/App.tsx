import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import CatalogPage from '@/pages/CatalogPage'
import CollectionPage from '@/pages/CollectionPage'
import LoginPage from '@/pages/LoginPage'
import PlansPage from '@/pages/PlansPage'
import PublicCatalogPage from '@/pages/PublicCatalogPage'
import RegisterPage from '@/pages/RegisterPage'
import SettingsPage from '@/pages/SettingsPage'
import WelcomePage from '@/pages/WelcomePage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import { API_BASE_URL } from '@/api/config'
import { type User } from '@/components/layout/Header'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    } else {
      setUser(null)
    }
  }, [isAuthenticated])

  async function fetchUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/protected/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        // If token is invalid
        localStorage.removeItem('token')
        setIsAuthenticated(false)
      }
    } catch {
      // Error handling
    }
  }

  const authHandlers = useMemo(
    () => ({
      onAuthenticated: () => {
        setIsAuthenticated(true)
        fetchUser()
      },
      onLogout: () => {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        setUser(null)
      },
    }),
    [],
  )

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/catalogos" replace />
          ) : (
            <WelcomePage />
          )
        }
      />

      <Route path="/c/:token" element={<PublicCatalogPage />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/catalogos" replace />
          ) : (
            <LoginPage onAuthenticated={authHandlers.onAuthenticated} />
          )
        }
      />

      <Route
        path="/registro"
        element={
          isAuthenticated ? (
            <Navigate to="/catalogos" replace />
          ) : (
            <RegisterPage onAuthenticated={authHandlers.onAuthenticated} />
          )
        }
      />

      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? (
            <Navigate to="/catalogos" replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />

      <Route
        path="/reset-password"
        element={
          isAuthenticated ? (
            <Navigate to="/catalogos" replace />
          ) : (
            <ResetPasswordPage />
          )
        }
      />

      <Route
        path="/catalogos"
        element={
          isAuthenticated ? (
            <CatalogPage onLogout={authHandlers.onLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/catalogos/:id"
        element={
          isAuthenticated ? (
            <CollectionPage onLogout={authHandlers.onLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/planos"
        element={
          isAuthenticated ? (
            <PlansPage onLogout={authHandlers.onLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/configuracoes"
        element={
          isAuthenticated ? (
            <SettingsPage onLogout={authHandlers.onLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/catalogos' : '/'} replace />} />
    </Routes>
  )
}

export default App
