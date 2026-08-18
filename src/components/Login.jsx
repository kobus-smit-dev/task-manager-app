import { useState } from 'react'
import { signInWithEmailAndPassword } from '../firebase'
import logo from '../assets/logo.svg'

function Login({ onToggle, onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authResult = await signInWithEmailAndPassword(email, password)
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
    <form className="auth-form" onSubmit={handleLogin}>
      <div className="auth-branding">
        <img src={logo} alt="Cybersmit logo" className="auth-logo" />
        <div className="auth-branding-text">
          <h2>Cybersmit Taskit</h2>
          <p>Your simple task manager<br />- Task It, Track It, Tick It -</p>
        </div>
      </div>
      <h3>Login</h3>
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

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="toggle-link">
        <span>Don't have an account? </span>
        <button type="button" onClick={onToggle}>
          Register here
        </button>
      </div>
    </form>
  )
}

export default Login
