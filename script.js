// All elements
const daysContainer = document.querySelector(".days"),
    nextBtn = document.querySelector(".next-btn"),
    prevBtn = document.querySelector(".prev-btn"),
    monthLabel = document.querySelector(".month"),
    todayBtn = document.querySelector(".today-btn"),
    themeToggle = document.getElementById("theme-toggle"),

    planner = document.getElementById("planner"),
    plannerDate = document.getElementById("planner-date"),
    plannerClose = document.getElementById("planner-close"),
    taskList = document.getElementById("task-list"),
    noTasks = document.getElementById("no-tasks"),
    taskTitleInput = document.getElementById("task-title"),
    taskDescInput = document.getElementById("task-desc"),
    addTaskBtn = document.getElementById("add-task-btn"),

    modalOverlay = document.getElementById("modal-overlay"),
    modalTitle = document.getElementById("modal-title"),
    modalDesc = document.getElementById("modal-desc"),
    modalClose = document.getElementById("modal-close"),
    modalDelete = document.getElementById("modal-delete"),
    
    months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"],
    
    today = new Date();

    
let currentMonth = today.getMonth();
let currentYear  = today.getFullYear();
let selectedDateKey = null;  
let activeTaskId    = null; 

function getTasks() {
  return JSON.parse(localStorage.getItem("calendarTasks") || "{}");
}
function saveTasks(tasks) {
  localStorage.setItem("calendarTasks", JSON.stringify(tasks));
}
function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// Calendar rendering
function renderCalendar() {
  const firstDay       = new Date(currentYear, currentMonth, 1);
  const lastDay        = new Date(currentYear, currentMonth + 1, 0);
  const lastDayIndex   = lastDay.getDay();
  const lastDayDate    = lastDay.getDate();
  const prevLastDay    = new Date(currentYear, currentMonth, 0);
  const prevLastDayDate = prevLastDay.getDate();
  const nextDays       = 7 - lastDayIndex - 1;

  monthLabel.textContent = `${months[currentMonth]} ${currentYear}`;

  const tasks  = getTasks();
  let html = "";

  // Previous month
  for (let x = firstDay.getDay(); x > 0; x--) {
    html += `<div class="day prev">${prevLastDayDate - x + 1}</div>`;
  }

  // Current month days
  for (let i = 1; i <= lastDayDate; i++) {
    const key        = dateKey(currentYear, currentMonth, i);
    const isToday    = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const isSelected = key === selectedDateKey;
    const dayTasks   = tasks[key] || [];

    let cls = "day";
    if (isToday)    cls += " today";
      if (isSelected) cls += " selected";
      
    let taskMarkup = "";
    if (dayTasks.length > 0) {
      taskMarkup = `<div class="task-dots">`;
      dayTasks.slice(0, 2).forEach(t => {
        taskMarkup += `<span class="task-dot-label">${t.title}</span>`;
      });
      if (dayTasks.length > 2) {
        taskMarkup += `<span class="task-dot-label more">+${dayTasks.length - 2}</span>`;
      }
      taskMarkup += `</div>`;
    }

    html += `<div class="${cls}" data-key="${key}" data-day="${i}">${i}${taskMarkup}</div>`;
  }

  // Next month
  for (let j = 1; j <= nextDays; j++) {
    html += `<div class="day next">${j}</div>`;
  }

  daysContainer.innerHTML = html;

  // Attach click listeners to current month days
  daysContainer.querySelectorAll(".day:not(.prev):not(.next)").forEach(el => {
    el.addEventListener("click", () => openPlanner(el.dataset.key, el.dataset.day));
  });
}

// Planner
function openPlanner(key, dayNum) {
  selectedDateKey = key;
  const [y, m, d] = key.split("-");
  plannerDate.textContent = `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  planner.classList.add("open");
  renderTaskList();
  renderCalendar();
}

function closePlanner() {
  planner.classList.remove("open");
  selectedDateKey = null;
  renderCalendar();
}

function renderTaskList() {
  const tasks    = getTasks();
  const dayTasks = tasks[selectedDateKey] || [];

  // Remove existing task items
  taskList.querySelectorAll(".task-item").forEach(el => el.remove());

  if (dayTasks.length === 0) {
    noTasks.style.display = "block";
    return;
  }
  noTasks.style.display = "none";

  dayTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";
    item.innerHTML = `
      <span class="task-item-title">${task.title}</span>
      ${task.desc ? `<span class="task-item-has-desc"><i class="fas fa-align-left"></i></span>` : ""}
    `;
    item.addEventListener("click", () => openModal(task.id));
    taskList.appendChild(item);
  });
}

// Add task
addTaskBtn.addEventListener("click", () => {
  const title = taskTitleInput.value.trim();
  if (!title || !selectedDateKey) return;

  const tasks = getTasks();
  if (!tasks[selectedDateKey]) tasks[selectedDateKey] = [];
  tasks[selectedDateKey].push({
    id:    Date.now().toString(),
    title: title,
    desc:  taskDescInput.value.trim()
  });
  saveTasks(tasks);

  taskTitleInput.value = "";
  taskDescInput.value  = "";
  renderTaskList();
  renderCalendar();
});

// Add task modal
function openModal(taskId) {
  const tasks    = getTasks();
  const dayTasks = tasks[selectedDateKey] || [];
  const task     = dayTasks.find(t => t.id === taskId);
  if (!task) return;

  activeTaskId      = taskId;
  modalTitle.textContent = task.title;
  modalDesc.textContent  = task.desc || "No description.";
  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");
  activeTaskId = null;
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

modalDelete.addEventListener("click", () => {
  if (!activeTaskId || !selectedDateKey) return;
  const tasks = getTasks();
  tasks[selectedDateKey] = (tasks[selectedDateKey] || []).filter(t => t.id !== activeTaskId);
  if (tasks[selectedDateKey].length === 0) delete tasks[selectedDateKey];
  saveTasks(tasks);
  closeModal();
  renderTaskList();
  renderCalendar();
});

// Nav
nextBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});
prevBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});
todayBtn.addEventListener("click", () => {
  currentMonth = today.getMonth();
  currentYear  = today.getFullYear();
  renderCalendar();
});

plannerClose.addEventListener("click", closePlanner);

// Dark Mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";
});

// Initial render
renderCalendar();