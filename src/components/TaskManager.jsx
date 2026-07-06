import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import {
  isFirebaseConfigured,
  firebaseDb,
  getStoredTasks,
  createTaskInStore,
  deleteTaskFromStore,
  updateTaskInStore,
} from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import KanbanBoard from './KanbanBoard'
import Archive from './Archive'
import './TaskManager.css'

function TaskManager({ user, view }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [clipboardTask, setClipboardTask] = useState(null)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, taskId: null })
  const [celebrationActive, setCelebrationActive] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [detailForm, setDetailForm] = useState({ text: '', description: '', createdAt: '', statusUpdates: [] })
  const [archivedTasks, setArchivedTasks] = useState([])
  const [deletePendingTask, setDeletePendingTask] = useState(null)
  const [archivePendingTask, setArchivePendingTask] = useState(null)
  const celebrationTimerRef = useRef(null)
  const applauseSoundRef = useRef(null)
  const contextMenuRef = useRef(null)

  const formatDatetimeLocal = (iso) => {
    const date = new Date(iso || new Date().toISOString())
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  const parseDatetimeLocal = (value) => {
    if (!value) return new Date().toISOString()
    const date = new Date(value)
    return date.toISOString()
  }

  const formatDateOnly = (iso) => {
    const date = new Date(iso || new Date().toISOString())
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 10)
  }

  const parseDateOnly = (value) => {
    if (!value) return new Date().toISOString()
    const date = new Date(value)
    return date.toISOString()
  }

  const loadArchivedTasks = () => {
    const archived = localStorage.getItem(`archived_tasks_${user.uid}`)
    if (archived) {
      setArchivedTasks(JSON.parse(archived))
    }
  }

  const saveArchivedTasks = (archived) => {
    localStorage.setItem(`archived_tasks_${user.uid}`, JSON.stringify(archived))
    setArchivedTasks(archived)
  }

  const archiveTask = async (taskId) => {
    try {
      const taskToArchive = tasks.find((task) => task.id === taskId)
      if (!taskToArchive) return

      const archivedTask = {
        ...taskToArchive,
        archivedAt: new Date().toISOString(),
      }

      if (!isFirebaseConfigured) {
        await deleteTaskFromStore(user.uid, taskId)
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
        const updated = [...archivedTasks, archivedTask]
        saveArchivedTasks(updated)
        return
      }

      // For Firebase, update the task with archived flag
      await updateDoc(doc(firebaseDb, 'tasks', taskId), {
        archived: true,
        archivedAt: new Date().toISOString(),
      })
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error('Error archiving task:', error)
    }
  }

  const unarchiveTask = async (taskId) => {
    try {
      const taskToUnarchive = archivedTasks.find((task) => task.id === taskId)
      if (!taskToUnarchive) return

      const { archivedAt, archived, ...taskData } = taskToUnarchive

      if (!isFirebaseConfigured) {
        const task = await createTaskInStore(user.uid, taskData.text, taskData.status)
        const updated = { ...task, ...taskData }
        setTasks((currentTasks) => [updated, ...currentTasks])
        const newArchived = archivedTasks.filter((task) => task.id !== taskId)
        saveArchivedTasks(newArchived)
        return
      }

      // For Firebase, remove archived flag
      await updateDoc(doc(firebaseDb, 'tasks', taskId), {
        archived: false,
      })
      setArchivedTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error('Error unarchiving task:', error)
    }
  }

  const deleteArchivedTask = async (taskId) => {
    try {
      if (!isFirebaseConfigured) {
        const newArchived = archivedTasks.filter((task) => task.id !== taskId)
        saveArchivedTasks(newArchived)
        return
      }

      // For Firebase, permanently delete the archived task
      await deleteDoc(doc(firebaseDb, 'tasks', taskId))
      setArchivedTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting archived task:', error)
    }
  }

  const deleteTaskWithConfirmation = (taskId) => {
    setDeletePendingTask(taskId)
  }

  const confirmDeleteTask = async () => {
    if (deletePendingTask) {
      await deleteTask(deletePendingTask)
      setDeletePendingTask(null)
      setDetailTask(null)
    }
  }

  const archiveTaskWithConfirmation = (taskId) => {
    setArchivePendingTask(taskId)
  }

  const confirmArchiveTask = async () => {
    if (archivePendingTask) {
      await archiveTask(archivePendingTask)
      setArchivePendingTask(null)
      setDetailTask(null)
    }
  }

  const openTaskDetails = (taskId) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    setDetailTask(task)
    setDetailForm({
      text: task.text || '',
      description: task.description || '',
      createdAt: formatDatetimeLocal(task.createdAt),
      statusUpdates: (task.statusUpdates || []).map((update) => ({
        ...update,
        date: formatDateOnly(update.date),
      })),
    })
    setContextMenu({ visible: false, x: 0, y: 0, taskId: null })
  }

  const closeTaskDetails = async (save = true) => {
    if (save && detailTask) {
      const updates = {
        text: detailForm.text,
        description: detailForm.description,
        createdAt: parseDatetimeLocal(detailForm.createdAt),
        statusUpdates: detailForm.statusUpdates.map((update) => ({
          ...update,
          date: parseDateOnly(update.date),
        })),
      }

      if (!isFirebaseConfigured) {
        await updateTaskInStore(user.uid, detailTask.id, updates)
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === detailTask.id ? { ...task, ...updates } : task
          )
        )
      } else {
        await updateDoc(doc(firebaseDb, 'tasks', detailTask.id), updates)
      }
    }

    setDetailTask(null)
  }

  const handleDetailFieldChange = (field, value) => {
    setDetailForm((current) => ({ ...current, [field]: value }))
  }

  const handleAddStatusUpdate = () => {
    const newUpdate = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      text: '',
      date: formatDateOnly(new Date().toISOString()),
    }
    setDetailForm((current) => ({
      ...current,
      statusUpdates: [newUpdate, ...current.statusUpdates],
    }))
  }

  const handleStatusUpdateChange = (id, field, value) => {
    setDetailForm((current) => ({
      ...current,
      statusUpdates: current.statusUpdates.map((update) =>
        update.id === id ? { ...update, [field]: value } : update
      ),
    }))
  }

  const handleRemoveStatusUpdate = (id) => {
    setDetailForm((current) => ({
      ...current,
      statusUpdates: current.statusUpdates.filter((update) => update.id !== id),
    }))
  }

  useEffect(() => {
    if (!user) return

    if (!isFirebaseConfigured) {
      loadArchivedTasks()
      setTasks(getStoredTasks(user.uid))
      setLoading(false)
      return
    }

    let isCancelled = false
    let unsubscribe = () => {}

    const loadTasks = async () => {
      if (!firebaseDb || isCancelled) return

      const q = query(
        collection(firebaseDb, 'tasks'),
        where('userId', '==', user.uid),
        where('archived', '!=', true)
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        if (!isCancelled) {
          setTasks(tasksData)
          setLoading(false)
        }
      })
    }

    loadTasks()

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [user])

  // Mirror the above for archived tasks: Firestore is the source of truth for
  // the Archive view once Firebase is configured (demo mode keeps using
  // localStorage via loadArchivedTasks above).
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return

    let isCancelled = false

    // One-time cleanup: earlier versions of the local-backup import wrote
    // archived tasks into localStorage instead of Firestore. Adopt any
    // leftovers into Firestore so they aren't stranded there.
    const migrateLegacyLocalArchive = async () => {
      const key = `archived_tasks_${user.uid}`
      const legacyArchived = JSON.parse(localStorage.getItem(key) || '[]')
      if (legacyArchived.length === 0) return

      // Claim the key synchronously, before any `await`, so a concurrent
      // remount (e.g. React StrictMode's double-invoke) can't read the same
      // entries again and double-import them.
      localStorage.removeItem(key)

      for (const task of legacyArchived) {
        const { id, ...taskData } = task
        await addDoc(collection(firebaseDb, 'tasks'), { ...taskData, userId: user.uid, archived: true })
      }
    }

    const q = query(
      collection(firebaseDb, 'tasks'),
      where('userId', '==', user.uid),
      where('archived', '==', true)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const archivedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      if (!isCancelled) {
        setArchivedTasks(archivedData)
      }
    })

    migrateLegacyLocalArchive()

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [user])

  // Auto-archive completed tasks based on user settings
  useEffect(() => {
    if (!user || !tasks.length) return

    const autoArchiveInterval = setInterval(() => {
      const autoArchiveDays = parseInt(localStorage.getItem(`autoArchive_${user.uid}`) || '0', 10)
      if (autoArchiveDays === 0) return

      const now = Date.now()
      const autoArchiveMs = autoArchiveDays * 24 * 60 * 60 * 1000

      tasks.forEach((task) => {
        if (task.completed && task.status === 'done') {
          const completedTime = new Date(task.completedAt || task.createdAt).getTime()
          if (now - completedTime > autoArchiveMs) {
            archiveTask(task.id).catch((err) => console.error('Auto-archive failed:', err))
          }
        }
      })
    }, 60000) // Check every minute

    return () => clearInterval(autoArchiveInterval)
  }, [user, tasks, archiveTask])

  const addTask = async (taskText, status = 'backlog') => {
    if (!taskText.trim()) return

    const newTaskData = {
      userId: user.uid,
      text: taskText,
      completed: status === 'done',
      status,
      order: Date.now(),
      createdAt: new Date().toISOString(),
      archived: false,
    }

    try {
      if (!isFirebaseConfigured) {
        const task = await createTaskInStore(user.uid, taskText, status)
        setTasks((currentTasks) => [task, ...currentTasks])
        return
      }

      await addDoc(collection(firebaseDb, 'tasks'), newTaskData)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      if (!isFirebaseConfigured) {
        await deleteTaskFromStore(user.uid, taskId)
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
        return
      }

      await deleteDoc(doc(firebaseDb, 'tasks', taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }



  const playAppluaseSound = () => {
    if (!applauseSoundRef.current) {
      applauseSoundRef.current = new Audio('/audio/applause.mp3')
    }
    applauseSoundRef.current.currentTime = 0
    applauseSoundRef.current.play().catch(() => {
      // Silently fail if audio can't autoplay
    })
  }

  const triggerCelebration = () => {
    const celebrationEnabled = localStorage.getItem(`celebrationEnabled_${user.uid}`) !== 'false'
    if (!celebrationEnabled) return

    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current)
    }

    setCelebrationActive(true)
    playAppluaseSound()
    celebrationTimerRef.current = setTimeout(() => {
      setCelebrationActive(false)
      celebrationTimerRef.current = null
    }, 6000)
  }

  const toggleTask = async (taskId, currentCompleted) => {
    try {
      const newCompleted = !currentCompleted
      const updates = {
        completed: newCompleted,
        status: newCompleted ? 'done' : 'backlog',
      }

      // Add or remove completedAt timestamp
      if (newCompleted) {
        updates.completedAt = new Date().toISOString()
      } else {
        updates.completedAt = null
      }

      if (!isFirebaseConfigured) {
        await updateTaskInStore(user.uid, taskId, updates)
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        )
        if (newCompleted) triggerCelebration()
        return
      }

      await updateDoc(doc(firebaseDb, 'tasks', taskId), updates)
      if (newCompleted) triggerCelebration()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const moveTask = async (taskId, targetStatus, targetTaskId = null) => {
    try {
      const currentTask = tasks.find((task) => task.id === taskId)
      if (!currentTask) return

      const celebration = targetStatus === 'done' && !currentTask.completed
      const updates = {
        status: targetStatus,
        completed: celebration || targetStatus === 'done',
      }
      if (targetStatus === 'backlog') {
        updates.order = Date.now()
        updates.completedAt = null
      } else if (targetStatus === 'done' && !currentTask.completed) {
        // Mark completion time when moving to done
        updates.completedAt = new Date().toISOString()
      }

      if (!isFirebaseConfigured) {
        await updateTaskInStore(user.uid, taskId, updates)
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        )
        if (targetTaskId && targetStatus === 'backlog') {
          await reorderBacklog(taskId, targetTaskId)
        }
        if (celebration) triggerCelebration()
        return
      }

      await updateDoc(doc(firebaseDb, 'tasks', taskId), updates)
      if (targetTaskId && targetStatus === 'backlog') {
        await reorderBacklog(taskId, targetTaskId)
      }
      if (celebration) triggerCelebration()
    } catch (error) {
      console.error('Error moving task:', error)
    }
  }

  const copyTask = (taskId) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    setClipboardTask(task)
    setContextMenu({ visible: false, x: 0, y: 0, taskId: null })
  }

  const pasteTask = async (targetTaskId) => {
    if (!clipboardTask) return
    const targetTask = tasks.find((item) => item.id === targetTaskId)
    const status = targetTask?.status || clipboardTask.status || 'backlog'
    await addTask(clipboardTask.text, status)
    setContextMenu({ visible: false, x: 0, y: 0, taskId: null })
  }

  const showTaskContextMenu = (taskId, event) => {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      taskId,
    })
  }

  const openTaskFromContext = () => {
    if (contextMenu.taskId) {
      openTaskDetails(contextMenu.taskId)
    }
  }

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current)
      }
      if (applauseSoundRef.current) {
        applauseSoundRef.current.pause()
        applauseSoundRef.current.currentTime = 0
      }
    }
  }, [])

  const handleTaskDoubleClick = (taskId) => {
    openTaskDetails(taskId)
  }

  useEffect(() => {
    const hideMenu = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, taskId: null })
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') hideMenu()
    }

    window.addEventListener('click', hideMenu)
    window.addEventListener('scroll', hideMenu)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('click', hideMenu)
      window.removeEventListener('scroll', hideMenu)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [contextMenu.visible])

  // Keep the context menu fully on-screen, flipping it above/left of the
  // cursor when it would otherwise overflow the bottom/right edge.
  useLayoutEffect(() => {
    if (!contextMenu.visible || !contextMenuRef.current) return

    const padding = 8
    const menuRect = contextMenuRef.current.getBoundingClientRect()
    const viewportRight = window.scrollX + window.innerWidth
    const viewportBottom = window.scrollY + window.innerHeight

    let adjustedX = contextMenu.x
    let adjustedY = contextMenu.y

    if (adjustedX + menuRect.width > viewportRight - padding) {
      adjustedX = contextMenu.x - menuRect.width
    }
    if (adjustedY + menuRect.height > viewportBottom - padding) {
      adjustedY = contextMenu.y - menuRect.height
    }

    adjustedX = Math.max(window.scrollX + padding, adjustedX)
    adjustedY = Math.max(window.scrollY + padding, adjustedY)

    if (adjustedX !== contextMenu.x || adjustedY !== contextMenu.y) {
      setContextMenu((current) => ({ ...current, x: adjustedX, y: adjustedY }))
    }
  }, [contextMenu.visible, contextMenu.x, contextMenu.y])

  const reorderBacklog = async (sourceTaskId, targetTaskId) => {
    const backlogTasks = tasks
      .filter((task) => (task.status || (task.completed ? 'done' : 'backlog')) === 'backlog')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const sourceIndex = backlogTasks.findIndex((task) => task.id === sourceTaskId)
    const targetIndex = backlogTasks.findIndex((task) => task.id === targetTaskId)
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return

    const ordered = [...backlogTasks]
    const [movedTask] = ordered.splice(sourceIndex, 1)
    ordered.splice(targetIndex, 0, movedTask)

    const updatedTasks = ordered.map((task, index) => ({
      ...task,
      order: index + 1,
    }))

    if (!isFirebaseConfigured) {
      await Promise.all(
        updatedTasks.map((task) => updateTaskInStore(user.uid, task.id, { order: task.order }))
      )
      setTasks((currentTasks) =>
        currentTasks.map((task) => {
          const updated = updatedTasks.find((item) => item.id === task.id)
          return updated ? updated : task
        })
      )
      return
    }

    await Promise.all(
      updatedTasks.map((task) => updateDoc(doc(firebaseDb, 'tasks', task.id), { order: task.order }))
    )
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        const updated = updatedTasks.find((item) => item.id === task.id)
        return updated ? updated : task
      })
    )
  }

  const getFilteredTasks = () => {
    let filtered = tasks
    
    switch (filter) {
      case 'active':
        filtered = tasks.filter((task) => !task.completed)
        break
      case 'completed':
        filtered = tasks.filter((task) => task.completed)
        break
      default:
        filtered = tasks
    }

    // Sort: active tasks first (by order), then completed tasks (by completedAt DESC)
    if (filter === 'all') {
      const activeTasks = filtered.filter((task) => !task.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const completedTasks = filtered.filter((task) => task.completed).sort((a, b) => {
        const timeA = new Date(a.completedAt || 0).getTime()
        const timeB = new Date(b.completedAt || 0).getTime()
        return timeB - timeA // Most recent first
      })
      return [...activeTasks, ...completedTasks]
    } else if (filter === 'completed') {
      // Sort by completedAt DESC (most recent first)
      return filtered.sort((a, b) => {
        const timeA = new Date(a.completedAt || 0).getTime()
        const timeB = new Date(b.completedAt || 0).getTime()
        return timeB - timeA
      })
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()
  const activeCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.filter((task) => task.completed).length
  const contextMenuTask = tasks.find((task) => task.id === contextMenu.taskId)
  const contextMenuTaskIsDone =
    contextMenuTask && (contextMenuTask.status === 'done' || contextMenuTask.completed)

  return (
    <div className="task-manager">
      <div className="task-manager-content">
        <TaskForm onAddTask={addTask} />
        
        <div className="task-stats">
          <span className="stat">{activeCount} active</span>
          <span className="stat">{completedCount} completed</span>
          <span className="stat">{tasks.length} total</span>
        </div>

        {view === 'list' ? (
          <>
            <div className="task-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                {filter === 'all' && "No tasks yet. Create one to get started!"}
                {filter === 'active' && "No active tasks!"}
                {filter === 'completed' && "No completed tasks yet."}
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                onToggleTask={toggleTask}
                onTaskContextMenu={showTaskContextMenu}
                onTaskOpen={openTaskDetails}
              />
            )}
          </>
        ) : view === 'archive' ? (
          <Archive
            archivedTasks={archivedTasks}
            onUnarchive={unarchiveTask}
            onDelete={deleteArchivedTask}
          />
        ) : (
          <KanbanBoard
            tasks={tasks}
            onMoveTask={moveTask}
            onTaskContextMenu={showTaskContextMenu}
            onTaskOpen={openTaskDetails}
            celebrationActive={celebrationActive}
          />
        )}
      </div>
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="context-menu-item"
            onClick={() => openTaskFromContext()}
          >
            Open task
          </button>
          <button
            type="button"
            className="context-menu-item"
            onClick={() => deleteTaskWithConfirmation(contextMenu.taskId)}
          >
            Delete task
          </button>
          {contextMenuTaskIsDone && (
            <button
              type="button"
              className="context-menu-item"
              onClick={() => archiveTaskWithConfirmation(contextMenu.taskId)}
            >
              Archive task
            </button>
          )}
          <button
            type="button"
            className="context-menu-item"
            onClick={() => copyTask(contextMenu.taskId)}
          >
            Copy task
          </button>
          <button
            type="button"
            className="context-menu-item"
            onClick={() => pasteTask(contextMenu.taskId)}
            disabled={!clipboardTask}
          >
            Paste task
          </button>
        </div>
      )}
      {detailTask && (
        <div className="task-detail-overlay">
          <div className="task-detail-backdrop" onClick={() => closeTaskDetails(false)} />
          <aside className="task-detail-panel">
            <div className="task-detail-scroll-area">
              <div className="task-detail-header">
                <div>
                  <h2>Task details</h2>
                  <p className="task-detail-subtitle">Use this panel to edit or review your task.</p>
                </div>
                <button
                  type="button"
                  className="task-detail-close"
                  onClick={() => closeTaskDetails(true)}
                  aria-label="Close task details"
                >
                  ✕
                </button>
              </div>

              <div className="task-detail-fields">
                <label className="task-detail-label">
                  Date created
                  <input
                    type="datetime-local"
                    value={detailForm.createdAt}
                    onChange={(event) => handleDetailFieldChange('createdAt', event.target.value)}
                  />
                </label>

                <label className="task-detail-label">
                  Task name
                  <input
                    type="text"
                    value={detailForm.text}
                    onChange={(event) => handleDetailFieldChange('text', event.target.value)}
                  />
                </label>

                <label className="task-detail-label task-detail-description-label">
                  Description
                  <textarea
                    value={detailForm.description}
                    onChange={(event) => handleDetailFieldChange('description', event.target.value)}
                    placeholder="Add more details here..."
                  />
                </label>

                <div className="task-detail-status-section">
                  <button
                    type="button"
                    className="task-detail-add-status-btn"
                    onClick={handleAddStatusUpdate}
                  >
                    + Add status update
                  </button>

                  {detailForm.statusUpdates.length > 0 && (
                    <div className="task-detail-status-list">
                      {detailForm.statusUpdates.map((update) => (
                        <div key={update.id} className="task-detail-status-item">
                          <div className="task-detail-status-item-header">
                            <input
                              type="date"
                              value={update.date}
                              onChange={(event) =>
                                handleStatusUpdateChange(update.id, 'date', event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="task-detail-status-remove-btn"
                              onClick={() => handleRemoveStatusUpdate(update.id)}
                              aria-label="Remove status update"
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            value={update.text}
                            onChange={(event) =>
                              handleStatusUpdateChange(update.id, 'text', event.target.value)
                            }
                            placeholder="What's the update?"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="task-detail-actions">
              <button
                type="button"
                className="task-detail-save-btn"
                onClick={() => closeTaskDetails(true)}
              >
                Save and close
              </button>
              <button
                type="button"
                className="task-detail-archive-btn"
                onClick={() => archiveTaskWithConfirmation(detailTask.id)}
              >
                Archive task
              </button>
              <button
                type="button"
                className="task-detail-delete-btn"
                onClick={() => deleteTaskWithConfirmation(detailTask.id)}
              >
                Delete task
              </button>
            </div>
          </aside>
        </div>
      )}
      {deletePendingTask && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog-backdrop" onClick={() => setDeletePendingTask(null)} />
          <div className="confirmation-dialog">
            <h3>Delete task?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirmation-dialog-actions">
              <button
                type="button"
                className="confirmation-dialog-cancel"
                onClick={() => setDeletePendingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-dialog-confirm"
                onClick={confirmDeleteTask}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {archivePendingTask && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog-backdrop" onClick={() => setArchivePendingTask(null)} />
          <div className="confirmation-dialog">
            <h3>Archive task?</h3>
            <p>You can unarchive it later from the Archive view.</p>
            <div className="confirmation-dialog-actions">
              <button
                type="button"
                className="confirmation-dialog-cancel"
                onClick={() => setArchivePendingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-dialog-confirm"
                onClick={confirmArchiveTask}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManager
