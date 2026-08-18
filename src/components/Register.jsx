import { useState } from 'react'
import { createUserWithEmailAndPassword } from '../firebase'

function Register({ onToggle, onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const authResult = await createUserWithEmailAndPassword(email, password)
      if (onAuthSuccess) {
        onAuthSuccess(authResult.user ?? authResult)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      <div className="auth-branding">
        <img src="/src/assets/logo.svg" alt="Cybersmit logo" className="auth-logo" />
        <div>
          <h2>Cybersmit Taskit</h2>
          <p>Your simple daily task manager - Task it, Track it, Tick it</p>
        </div>
      </div>
      <h3>Register</h3>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>

      <div className="toggle-link">
        <span>Already have an account? </span>
        <button type="button" onClick={onToggle}>
          Login here
        </button>
      </div>
    </form>
  )
}

export default Register
