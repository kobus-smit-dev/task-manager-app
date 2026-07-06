import { useState, useMemo } from 'react'
import './Archive.css'

function Archive({ archivedTasks, onUnarchive, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletePendingId, setDeletePendingId] = useState(null)

  const confirmDelete = () => {
    if (deletePendingId) {
      onDelete(deletePendingId)
      setDeletePendingId(null)
    }
  }

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return archivedTasks
    const query = searchQuery.toLowerCase()
    return archivedTasks.filter(
      (task) =>
        task.text.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    )
  }, [archivedTasks, searchQuery])

  return (
    <div className="archive-container">
      <div className="archive-header">
        <h2>Archived Tasks</h2>
      </div>

      {archivedTasks.length > 0 && (
        <div className="archive-search-box">
          <input
            type="text"
            placeholder="Search archived tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="archive-search-input"
          />
        </div>
      )}

      {archivedTasks.length === 0 ? (
        <div className="archive-empty">
          <p>No archived tasks yet.</p>
          <p className="archive-empty-hint">Completed tasks will appear here when archived.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="archive-empty">
          <p>No tasks match your search.</p>
          <p className="archive-empty-hint">Try a different search term.</p>
        </div>
      ) : (
        <ul className="archive-list">
          {filteredTasks.map((task) => (
            <li key={task.id} className="archive-item">
              <div className="archive-item-content">
                <p className="archive-item-text">{task.text}</p>
                {task.description && <p className="archive-item-description">{task.description}</p>}
                <p className="archive-item-meta">
                  Archived {new Date(task.archivedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="archive-item-actions">
                <button
                  onClick={() => onUnarchive(task.id)}
                  className="unarchive-btn"
                  title="Restore to done"
                >
                  Restore
                </button>
                <button
                  onClick={() => setDeletePendingId(task.id)}
                  className="archive-delete-btn"
                  title="Delete permanently"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deletePendingId && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog-backdrop" onClick={() => setDeletePendingId(null)} />
          <div className="confirmation-dialog">
            <h3>Delete task permanently?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirmation-dialog-actions">
              <button
                type="button"
                className="confirmation-dialog-cancel"
                onClick={() => setDeletePendingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-dialog-confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Archive
