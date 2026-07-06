import './TaskList.css'

function TaskList({ tasks, onToggleTask, onTaskContextMenu, onTaskOpen }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`task-item ${task.completed ? 'completed' : ''}`}
          onContextMenu={(event) => onTaskContextMenu(task.id, event)}
          onDoubleClick={() => onTaskOpen?.(task.id)}
        >
          <div className="task-content">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(task.id, task.completed)}
              className="task-checkbox"
            />
            <span className="task-text">{task.text}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default TaskList
