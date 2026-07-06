import './TaskManager.css'

const statusLabels = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  done: 'Done',
}

function KanbanBoard({ tasks, onMoveTask, onTaskContextMenu, onTaskOpen, celebrationActive }) {
  const columns = [
    { key: 'backlog', title: statusLabels.backlog },
    { key: 'in-progress', title: statusLabels['in-progress'] },
    { key: 'done', title: statusLabels.done },
  ]

  const tasksByStatus = (status) =>
    tasks
      .filter((task) => (task.status || (task.completed ? 'done' : 'backlog')) === status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const handleDragStart = (event, taskId, currentStatus) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ taskId, currentStatus }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (event, targetStatus, targetTaskId) => {
    event.preventDefault()
    const payload = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (!payload || !payload.taskId) return

    onMoveTask(payload.taskId, targetStatus, targetTaskId)
  }

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const columnTasks = tasksByStatus(column.key)

        return (
          <section
            key={column.key}
            className={`kanban-column kanban-column-${column.key} ${column.key === 'done' && celebrationActive ? 'celebrating' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, column.key, null)}
          >
            <div className="kanban-column-header">
              <h3>{column.title}</h3>
              <span>{columnTasks.length}</span>
            </div>
            <div className="kanban-column-body">
              {column.key === 'done' && celebrationActive && (
                <>
                  <div className="done-celebration">
                    {Array.from({ length: 50 }).map((_, index) => {
                      const left = Math.random() * 88 + 6
                      const delay = Math.random() * 0.8
                      const speedVariation = Math.random()
                      let duration
                      let animationName = 'confettiRain'
                      
                      if (speedVariation < 0.33) {
                        duration = 7 + Math.random() * 1.5
                        animationName = 'confettiRainSlow'
                      } else if (speedVariation < 0.66) {
                        duration = 5.5 + Math.random() * 1
                        animationName = 'confettiRain'
                      } else {
                        duration = 4 + Math.random() * 1
                        animationName = 'confettiRainFast'
                      }
                      
                      const size = 6 + Math.random() * 10
                      const colorIndex = Math.floor(Math.random() * 4)
                      const drift = (Math.random() - 0.5) * 80
                      const rotation = Math.random() * 360

                      return (
                        <span
                          key={index}
                          className={`confetti confetti-${colorIndex + 1} confetti-${animationName}`}
                          style={{
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${duration}s`,
                            '--drift-x': `${drift}px`,
                            '--rotation-start': `${rotation}deg`,
                          }}
                        />
                      )
                    })}
                  </div>
                  <div className="crowd-applause">🎉 Well done! 🎉</div>
                </>
              )}
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className="kanban-card"
                  draggable
                  onContextMenu={(event) => onTaskContextMenu(task.id, event)}
                  onDoubleClick={() => onTaskOpen?.(task.id)}
                  onDragStart={(event) => handleDragStart(event, task.id, column.key)}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, column.key, task.id)}
                >
                  <div className="kanban-card-content">
                    <p>{task.text}</p>
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && <div className="kanban-empty">No tasks</div>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default KanbanBoard
