/**
 * Modern To-Do List Application
 * Beginner-friendly, well-organized Vanilla JavaScript
 */

// ==========================================
// 1. STATE & STORAGE KEYS
// ==========================================
const STORAGE_KEY_TASKS = 'modern_todo_tasks_data';
const STORAGE_KEY_THEME = 'modern_todo_theme_pref';

let tasks = [];
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
let editingTaskId = null;

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const currentDateEl = document.getElementById('currentDate');
const themeToggleBtn = document.getElementById('themeToggle');
const remainingCountEl = document.getElementById('remainingCount');
const progressPercentEl = document.getElementById('progressPercent');
const progressBarEl = document.getElementById('progressBar');

const todoForm = document.getElementById('todoForm');
const taskInput = document.getElementById('taskInput');
const taskDateTime = document.getElementById('taskDateTime');

const filterTabs = document.querySelectorAll('.filter-tab');
const countAllEl = document.getElementById('countAll');
const countActiveEl = document.getElementById('countActive');
const countCompletedEl = document.getElementById('countCompleted');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTaskInput = document.getElementById('editTaskInput');
const editDateTimeInput = document.getElementById('editDateTimeInput');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// ==========================================
// 3. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initDateDisplay();
  initTheme();
  loadTasks();
  setupEventListeners();
  render();
});

// Display current day and date (e.g., "Thursday, Sep 17")
function initDateDisplay() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, options);
  if (currentDateEl) {
    currentDateEl.textContent = today;
  }
}

// Initialize Theme (Dark/Light mode)
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_KEY_THEME, newTheme);
}

// ==========================================
// 4. TASK DATA MANAGEMENT (LOCAL STORAGE)
// ==========================================
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      // Default welcome sample tasks for a first-time user
      tasks = [
        {
          id: 'task-1',
          text: 'Welcome to your new To-Do List! ✨',
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: ''
        },
        {
          id: 'task-2',
          text: 'Tap the checkbox to mark a task as completed',
          completed: true,
          createdAt: new Date().toISOString(),
          dueDate: ''
        },
        {
          id: 'task-3',
          text: 'Try adding your first task above 🚀',
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: ''
        }
      ];
      saveTasks();
    }
  } catch (err) {
    console.error('Failed to parse tasks from localStorage:', err);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

// ==========================================
// 5. CORE ACTIONS
// ==========================================

// Add New Task
function addTask(text, dueDate) {
  const trimmed = text.trim();
  if (!trimmed) {
    // Visual feedback for empty input
    taskInput.classList.add('input-error');
    setTimeout(() => taskInput.classList.remove('input-error'), 400);
    return;
  }

  const newTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    text: trimmed,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: dueDate ? new Date(dueDate).toISOString() : ''
  };

  tasks.unshift(newTask);
  saveTasks();
  render();

  // Reset inputs
  taskInput.value = '';
  taskDateTime.value = '';
  taskInput.focus();
}

// Toggle Task Completed Status
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

// Delete Task (with animation)
function deleteTask(id) {
  const taskElement = document.querySelector(`[data-id="${id}"]`);
  if (taskElement) {
    taskElement.classList.add('removing');
    taskElement.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
    }, { once: true });
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }
}

// Clear Completed Tasks
function clearCompleted() {
  const hasCompleted = tasks.some(t => t.completed);
  if (!hasCompleted) return;

  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

// Open Edit Modal
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId = id;
  editTaskInput.value = task.text;

  if (task.dueDate) {
    // Format ISO to YYYY-MM-DDTHH:MM for datetime-local
    const dt = new Date(task.dueDate);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
    editDateTimeInput.value = localISOTime;
  } else {
    editDateTimeInput.value = '';
  }

  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  editTaskInput.focus();
}

// Close Edit Modal
function closeEditModal() {
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editingTaskId = null;
}

// Save Edited Task
function saveEditTask(newText, newDueDate) {
  const trimmed = newText.trim();
  if (!trimmed || !editingTaskId) return;

  const task = tasks.find(t => t.id === editingTaskId);
  if (task) {
    task.text = trimmed;
    task.dueDate = newDueDate ? new Date(newDueDate).toISOString() : '';
    saveTasks();
    render();
  }
  closeEditModal();
}

// ==========================================
// 6. UI RENDERING
// ==========================================
function render() {
  renderStats();
  renderList();
}

// Update stats, counts, and progress bar
function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  // Remaining tasks highlight
  remainingCountEl.textContent = active;

  // Tab badges
  countAllEl.textContent = total;
  countActiveEl.textContent = active;
  countCompletedEl.textContent = completed;

  // Clear completed button state
  clearCompletedBtn.disabled = completed === 0;

  // Progress bar calculation
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressPercentEl.textContent = `${percentage}%`;
  progressBarEl.style.width = `${percentage}%`;
}

// Render the task items
function renderList() {
  // Filter tasks
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  // Handle empty state
  if (filteredTasks.length === 0) {
    emptyState.classList.add('show');
    taskList.innerHTML = '';
    return;
  }

  emptyState.classList.remove('show');
  taskList.innerHTML = '';

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);

    // Date/Time badge info
    let dateBadgeHtml = '';
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const isPast = due < new Date() && !task.completed;
      const formatted = due.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      dateBadgeHtml = `
        <span class="task-date-badge ${isPast ? 'is-overdue' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${isPast ? 'Overdue: ' : ''}${formatted}
        </span>
      `;
    } else if (task.createdAt) {
      const created = new Date(task.createdAt);
      const formatted = created.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      dateBadgeHtml = `
        <span class="task-date-badge">
          ${formatted}
        </span>
      `;
    }

    // Safely escaped text
    const escapedText = escapeHtml(task.text);

    li.innerHTML = `
      <label class="task-checkbox-wrapper" aria-label="Mark task complete">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="custom-checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>

      <div class="task-content">
        <span class="task-text">${escapedText}</span>
        <div class="task-meta">
          ${dateBadgeHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="action-btn edit-btn" aria-label="Edit task" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button class="action-btn delete-btn" aria-label="Delete task" title="Delete task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Event listeners on item elements
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    // Double click to edit convenience
    const content = li.querySelector('.task-content');
    content.addEventListener('dblclick', () => openEditModal(task.id));

    taskList.appendChild(li);
  });
}

// Utility to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================
// 7. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Add Task Form Submission (handles button click & Enter key in input)
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value, taskDateTime.value);
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });

  // Clear Completed
  clearCompletedBtn.addEventListener('click', clearCompleted);

  // Edit Modal Form Submission
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditTask(editTaskInput.value, editDateTimeInput.value);
  });

  closeModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Close modal when clicking on overlay outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('open')) {
      closeEditModal();
    }
  });
}
