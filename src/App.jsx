import { useState, useEffect } from 'react'
import { isFirebaseConfigured, onAuthStateChangedUser, signOutUser } from './firebase'
import Login from './components/Login'
import Register from './components/Register'
import TaskManager from './components/TaskManager'
import Settings from './components/Settings'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [view, setView] = useState('list')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChangedUser((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const savedView = localStorage.getItem(`defaultView_${user.uid}`)
    if (savedView === 'list' || savedView === 'kanban') {
      setView(savedView)
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await signOutUser()
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return (
      <div className="auth-container">
        {!isFirebaseConfigured && (
          <div className="demo-banner">
            Demo mode is active. Your tasks stay in this browser until Firebase is configured.
          </div>
        )}
        {showRegister ? (
          <Register onToggle={() => setShowRegister(false)} onAuthSuccess={setUser} />
        ) : (
          <Login onToggle={() => setShowRegister(true)} onAuthSuccess={setUser} />
        )}
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-header">
          <img src="/src/assets/logo.svg" alt="Cybersmit logo" className="brand-logo" />
          <h1>Cybersmit Task Manager</h1>
        </div>
        <div className="user-info">
          <select
            className="view-select"
            value={view}
            onChange={(e) => setView(e.target.value)}
            aria-label="Select task view"
          >
            <option value="list">List view</option>
            <option value="kanban">Kanban view</option>
          </select>
          <button
            className="archive-icon-btn"
            onClick={() => setView('archive')}
            title="View archive"
            aria-label="View archived tasks"
          >
            📦
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
            aria-label="Open settings"
          >
            ⚙️
          </button>
          <span>{user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      {!isFirebaseConfigured && (
        <div className="demo-banner demo-banner-inline">
          Demo mode active: tasks are saved locally in your browser.
        </div>
      )}
      <TaskManager user={user} view={view} />
      {showSettings && <Settings onClose={() => setShowSettings(false)} userId={user.uid} />}
    </div>
  )
}

export default App
