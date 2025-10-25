import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SafeWay
            </Link>
            
            <nav className="hidden md:flex gap-4">
              <Link 
                to="/" 
                className="text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Map
              </Link>
              <Link 
                to="/emergency-contacts" 
                className="text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Contacts
              </Link>
            </nav>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-900">{user.name}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
