import { useState, useEffect } from 'react'
import './Settings.css'

function Settings({ onClose, userId }) {
  const [autoArchiveDays, setAutoArchiveDays] = useState(null)
  const [celebrationEnabled, setCelebrationEnabled] = useState(true)
  const [defaultView, setDefaultView] = useState('kanban')

  useEffect(() => {
    const saved = localStorage.getItem(`autoArchive_${userId}`)
    if (saved) {
      setAutoArchiveDays(parseInt(saved, 10))
    }

    const savedCelebration = localStorage.getItem(`celebrationEnabled_${userId}`)
    setCelebrationEnabled(savedCelebration !== 'false')

    const savedView = localStorage.getItem(`defaultView_${userId}`)
    if (savedView === 'list' || savedView === 'kanban') {
      setDefaultView(savedView)
    }
  }, [userId])

  const handleCelebrationToggle = (enabled) => {
    setCelebrationEnabled(enabled)
    localStorage.setItem(`celebrationEnabled_${userId}`, enabled.toString())
  }

  const handleDefaultViewChange = (viewOption) => {
    setDefaultView(viewOption)
    localStorage.setItem(`defaultView_${userId}`, viewOption)
  }

  const handleAutoArchiveChange = (days) => {
    setAutoArchiveDays(days)
    localStorage.setItem(`autoArchive_${userId}`, days.toString())
  }

  const handleDisableAutoArchive = () => {
    setAutoArchiveDays(null)
    localStorage.removeItem(`autoArchive_${userId}`)
  }

  return (
    <div className="settings-overlay">
      <div className="settings-backdrop" onClick={onClose} />
      <aside className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Auto Archive</h3>
            <p className="settings-description">
              Automatically move completed tasks to archive after a set time period.
            </p>

            <div className="settings-options">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="auto-archive"
                  checked={autoArchiveDays === null}
                  onChange={handleDisableAutoArchive}
                />
                <span>Disabled</span>
              </label>

              <label className="settings-radio">
                <input
                  type="radio"
                  name="auto-archive"
                  checked={autoArchiveDays === 1}
                  onChange={() => handleAutoArchiveChange(1)}
                />
                <span>One day</span>
              </label>

              <label className="settings-radio">
                <input
                  type="radio"
                  name="auto-archive"
                  checked={autoArchiveDays === 7}
                  onChange={() => handleAutoArchiveChange(7)}
                />
                <span>One week</span>
              </label>

              <label className="settings-radio">
                <input
                  type="radio"
                  name="auto-archive"
                  checked={autoArchiveDays === 30}
                  onChange={() => handleAutoArchiveChange(30)}
                />
                <span>One month</span>
              </label>
            </div>

            {autoArchiveDays && (
              <p className="settings-info">
                ✓ Auto archive enabled: Tasks will be archived after {autoArchiveDays} day
                {autoArchiveDays !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="settings-section">
            <h3>Celebration Animation</h3>
            <p className="settings-description">
              Show the confetti animation and applause sound when you complete a task.
            </p>

            <label className="settings-switch-row">
              <span>{celebrationEnabled ? 'Enabled' : 'Disabled'}</span>
              <span className="settings-switch">
                <input
                  type="checkbox"
                  checked={celebrationEnabled}
                  onChange={(e) => handleCelebrationToggle(e.target.checked)}
                />
                <span className="settings-switch-track" />
              </span>
            </label>
          </div>

          <div className="settings-section">
            <h3>Default View</h3>
            <p className="settings-description">
              Choose which view opens by default when you start the app.
            </p>

            <div className="settings-options">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="default-view"
                  checked={defaultView === 'list'}
                  onChange={() => handleDefaultViewChange('list')}
                />
                <span>List view</span>
              </label>

              <label className="settings-radio">
                <input
                  type="radio"
                  name="default-view"
                  checked={defaultView === 'kanban'}
                  onChange={() => handleDefaultViewChange('kanban')}
                />
                <span>Kanban view</span>
              </label>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Settings
