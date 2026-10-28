import { Navigate, useLocation } from 'react-router-dom'
import { FullPageLoader } from '../components/Spinner'
import { useAuth } from '../context/auth'

export default function RequireAdmin({ children }) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullPageLoader label="Memeriksa sesi admin..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return children
}
