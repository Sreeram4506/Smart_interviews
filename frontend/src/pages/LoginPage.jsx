import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Eye, EyeOff, GraduationCap, ChefHat, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_ROUTES = {
  student: '/student/feedback',
  mess_owner: '/owner/overview',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loading, error, clearError } = useAuth()

  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()

    try {
      let user
      if (isRegister) {
        user = await register(username, password, role, name || username)
      } else {
        user = await login(username, password)
      }
      navigate(ROLE_ROUTES[user.role], { replace: true })
    } catch {
      // error is already set in context
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister)
    clearError()
  }

  return (
    <div className="login-page">
      <div className="login-orb orb-1" />
      <div className="login-orb orb-2" />
      <div className="login-orb orb-3" />

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-header">
          <motion.div
            className="login-brand-mark"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Sparkles size={28} />
          </motion.div>
          <h1 className="login-title">MessPulse AI</h1>
          <p className="login-subtitle">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <motion.form
          className="login-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                key="error"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isRegister && (
            <div className="form-field">
              <label htmlFor="name">Display Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>



          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="spinner" /> Please wait…</>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </motion.form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={toggleMode} className="toggle-link">
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
