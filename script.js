// Task Manager Application
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks()
    this.currentFilter = "all"
    this.editingTaskId = null
    this.init()
  }

  init() {
    this.bindEvents()
    this.render()
    this.updateStats()
  }

  bindEvents() {
    // Task form submission
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addTask()
    })

    // Character counter for main input
    document.getElementById("taskInput").addEventListener("input", (e) => {
      this.updateCharCounter("charCount", e.target.value.length)
    })

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter)
      })
    })

    // Bulk actions
    document.getElementById("markAllComplete").addEventListener("click", () => {
      this.markAllComplete()
    })

    document.getElementById("clearCompleted").addEventListener("click", () => {
      this.clearCompleted()
    })

    // Modal events
    document.getElementById("modalClose").addEventListener("click", () => {
      this.closeModal()
    })

    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.closeModal()
    })

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal()
      }
    })

    // Edit form submission
    document.getElementById("editTaskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveEdit()
    })

    // Character counter for edit input
    document.getElementById("editTaskInput").addEventListener("input", (e) => {
      this.updateCharCounter("editCharCount", e.target.value.length)
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
      }
    })
  }

  addTask() {
    const input = document.getElementById("taskInput")
    const text = input.value.trim()

    if (!text) {
      this.showNotification("Please enter a task description", "error")
      return
    }

    const task = {
      id: Date.now().toString(),
      text: text,
      completed: false,
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.tasks.unshift(task)
    this.saveTasks()
    this.render()
    this.updateStats()

    input.value = ""
    this.updateCharCounter("charCount", 0)

    this.showNotification("Task added successfully!", "success")
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (!task) return

    this.editingTaskId = id

    document.getElementById("editTaskInput").value = task.text
    document.getElementById("taskPriority").value = task.priority
    this.updateCharCounter("editCharCount", task.text.length)

    this.openModal()
  }

  saveEdit() {
    const text = document.getElementById("editTaskInput").value.trim()
    const priority = document.getElementById("taskPriority").value

    if (!text) {
      this.showNotification("Please enter a task description", "error")
      return
    }

    const taskIndex = this.tasks.findIndex((t) => t.id === this.editingTaskId)
    if (taskIndex === -1) return

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      text: text,
      priority: priority,
      updatedAt: new Date().toISOString(),
    }

    this.saveTasks()
    this.render()
    this.updateStats()
    this.closeModal()

    this.showNotification("Task updated successfully!", "success")
  }

  deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`)
    if (taskElement) {
      taskElement.classList.add("removing")

      setTimeout(() => {
        this.tasks = this.tasks.filter((task) => task.id !== id)
        this.saveTasks()
        this.render()
        this.updateStats()
        this.showNotification("Task deleted successfully!", "info")
      }, 300)
    }
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      task.updatedAt = new Date().toISOString()
      this.saveTasks()
      this.render()
      this.updateStats()

      const message = task.completed ? "Task completed!" : "Task marked as active"
      this.showNotification(message, "success")
    }
  }

  markAllComplete() {
    const activeTasks = this.tasks.filter((task) => !task.completed)
    if (activeTasks.length === 0) {
      this.showNotification("No active tasks to complete", "info")
      return
    }

    this.tasks.forEach((task) => {
      if (!task.completed) {
        task.completed = true
        task.updatedAt = new Date().toISOString()
      }
    })

    this.saveTasks()
    this.render()
    this.updateStats()
    this.showNotification(`${activeTasks.length} tasks completed!`, "success")
  }

  clearCompleted() {
    const completedTasks = this.tasks.filter((task) => task.completed)
    if (completedTasks.length === 0) {
      this.showNotification("No completed tasks to clear", "info")
      return
    }

    this.tasks = this.tasks.filter((task) => !task.completed)
    this.saveTasks()
    this.render()
    this.updateStats()
    this.showNotification(`${completedTasks.length} completed tasks cleared!`, "info")
  }

  setFilter(filter) {
    this.currentFilter = filter

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-filter="${filter}"]`).classList.add("active")

    this.render()
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "active":
        return this.tasks.filter((task) => !task.completed)
      case "completed":
        return this.tasks.filter((task) => task.completed)
      default:
        return this.tasks
    }
  }

  render() {
    const taskList = document.getElementById("taskList")
    const emptyState = document.getElementById("emptyState")
    const filteredTasks = this.getFilteredTasks()

    if (filteredTasks.length === 0) {
      taskList.innerHTML = ""
      emptyState.classList.remove("hidden")

      // Update empty state message based on filter
      const emptyMessages = {
        all: "No tasks yet",
        active: "No active tasks",
        completed: "No completed tasks",
      }

      emptyState.querySelector("h3").textContent = emptyMessages[this.currentFilter]
    } else {
      emptyState.classList.add("hidden")
      taskList.innerHTML = filteredTasks.map((task) => this.createTaskHTML(task)).join("")

      // Bind events for task items
      this.bindTaskEvents()
    }
  }

  createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`
    const completedClass = task.completed ? "completed" : ""
    const checkIcon = task.completed ? '<i class="fas fa-check"></i>' : ""

    return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle">
                    ${checkIcon}
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="task-date">${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" data-action="edit" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
  }

  bindTaskEvents() {
    document.querySelectorAll(".task-item").forEach((item) => {
      const taskId = item.dataset.taskId

      // Toggle task completion
      item.querySelector('[data-action="toggle"]').addEventListener("click", () => {
        this.toggleTask(taskId)
      })

      // Edit task
      item.querySelector('[data-action="edit"]').addEventListener("click", () => {
        this.editTask(taskId)
      })

      // Delete task
      item.querySelector('[data-action="delete"]').addEventListener("click", () => {
        this.deleteTask(taskId)
      })
    })
  }

  updateStats() {
    const total = this.tasks.length
    const completed = this.tasks.filter((task) => task.completed).length
    const active = total - completed

    document.getElementById("totalTasks").textContent = total
    document.getElementById("activeTasks").textContent = active
    document.getElementById("completedTasks").textContent = completed
  }

  openModal() {
    document.getElementById("modalOverlay").classList.add("active")
    document.body.style.overflow = "hidden"

    // Focus on the edit input
    setTimeout(() => {
      document.getElementById("editTaskInput").focus()
    }, 100)
  }

  closeModal() {
    document.getElementById("modalOverlay").classList.remove("active")
    document.body.style.overflow = ""
    this.editingTaskId = null
  }

  updateCharCounter(counterId, length) {
    document.getElementById(counterId).textContent = length
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification")
    const messageEl = notification.querySelector(".notification-message")
    const iconEl = notification.querySelector(".notification-icon")

    // Set message and type
    messageEl.textContent = message
    notification.className = `notification ${type}`

    // Set appropriate icon
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    }
    iconEl.className = `notification-icon ${icons[type]}`

    // Show notification
    notification.classList.add("show")

    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return "Today"
    } else if (diffDays === 2) {
      return "Yesterday"
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  saveTasks() {
    localStorage.setItem("taskmaster-tasks", JSON.stringify(this.tasks))
  }

  loadTasks() {
    const saved = localStorage.getItem("taskmaster-tasks")
    return saved ? JSON.parse(saved) : []
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TaskManager()
})

// Service Worker registration for offline functionality (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
