(() => {
  "use strict";

  const STORAGE_KEY = "adarsh-todos";
  const LEGACY_KEYS = ["todos", "todoList", "todo-items"];
  const byId = id => document.getElementById(id);
  const form = byId("todoForm"), input = byId("todoInput"), list = byId("todoList");
  if (!form || !input || !list) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tasks = loadTasks();
  let filter = "all";
  let query = "";
  let sort = "created";

  const makeId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "todo-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  };

  function normalizeTask(raw, index) {
    if (!raw || typeof raw !== "object") return null;
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 240) : "";
    if (!title) return null;
    const createdAt = Number(raw.createdAt) || Date.now() + index;
    return {
      id: String(raw.id || makeId()),
      title,
      completed: Boolean(raw.completed ?? raw.done),
      priority: ["low", "normal", "high"].includes(raw.priority) ? raw.priority : "normal",
      category: typeof raw.category === "string" ? raw.category.trim().slice(0, 32) : "",
      dueDate: typeof raw.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) ? raw.dueDate : "",
      createdAt,
      updatedAt: Number(raw.updatedAt) || createdAt,
      order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : index
    };
  }

  function decode(raw) {
    try {
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.todos) ? parsed.todos : [];
      return source.map(normalizeTask).filter(Boolean);
    } catch {
      return null;
    }
  }

  function loadTasks() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== null) return decode(current) || [];
      for (const key of LEGACY_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        const migrated = decode(raw);
        if (migrated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}
    return [];
  }

  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
  }

  function priorityRank(value) {
    return value === "high" ? 0 : value === "normal" ? 1 : 2;
  }

  function visibleTasks() {
    const q = query.trim().toLowerCase();
    return tasks.filter(task => {
      const matchesFilter = filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "completed" && task.completed);
      const haystack = [task.title, task.category, task.priority].join(" ").toLowerCase();
      return matchesFilter && (!q || haystack.includes(q));
    }).sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority) || b.createdAt - a.createdAt;
      if (sort === "due") return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99") || b.createdAt - a.createdAt;
      if (sort === "alphabetical") return a.title.localeCompare(b.title);
      return b.createdAt - a.createdAt;
    });
  }

  function dueLabel(date) {
    if (!date) return "";
    const parsed = new Date(date + "T00:00:00");
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function isOverdue(task) {
    return Boolean(task.dueDate && !task.completed && task.dueDate < new Date().toISOString().slice(0, 10));
  }

  function metaFor(task) {
    const meta = document.createElement("div");
    meta.className = "task-meta";
    if (task.priority !== "normal") {
      const priority = document.createElement("span");
      priority.className = "priority " + task.priority;
      priority.textContent = task.priority;
      meta.append(priority);
    }
    if (task.category) {
      const category = document.createElement("span");
      category.textContent = task.category;
      meta.append(category);
    }
    if (task.dueDate) {
      const due = document.createElement("span");
      due.className = "due" + (isOverdue(task) ? " overdue" : "");
      due.textContent = (isOverdue(task) ? "Overdue · " : "Due · ") + dueLabel(task.dueDate);
      meta.append(due);
    }
    return meta;
  }

  function editTask(item, task) {
    if (item.classList.contains("editing")) return;
    item.classList.add("editing");
    const editor = document.createElement("form");
    editor.className = "inline-editor";

    const title = document.createElement("input");
    title.value = task.title; title.maxLength = 240; title.setAttribute("aria-label", "Task title");
    const priority = document.createElement("select");
    ["low", "normal", "high"].forEach(value => {
      const option = new Option(value[0].toUpperCase() + value.slice(1), value);
      option.selected = value === task.priority;
      priority.add(option);
    });
    priority.setAttribute("aria-label", "Priority");

    const category = document.createElement("input");
    category.value = task.category; category.maxLength = 32; category.placeholder = "Category"; category.setAttribute("aria-label", "Category");
    const due = document.createElement("input");
    due.type = "date"; due.value = task.dueDate; due.setAttribute("aria-label", "Due date");
    const save = document.createElement("button");
    save.type = "submit"; save.textContent = "Save";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.textContent = "Cancel";

    editor.append(title, priority, category, due, save, cancel);
    item.querySelector(".task-body").replaceChildren(editor);

    editor.addEventListener("submit", event => {
      event.preventDefault();
      const value = title.value.trim();
      if (!value) { title.focus(); return; }
      Object.assign(task, {
        title: value.slice(0, 240),
        priority: priority.value,
        category: category.value.trim().slice(0, 32),
        dueDate: due.value,
        updatedAt: Date.now()
      });
      saveTasks(); render();
    });
    cancel.addEventListener("click", render);
    editor.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); render(); }
    });
    title.focus(); title.select();
  }

  function createTaskItem(task) {
    const item = document.createElement("li");
    item.className = "todo-item" + (task.completed ? " done" : "");
    item.dataset.id = task.id;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "check";
    check.textContent = task.completed ? "✓" : "";
    check.setAttribute("aria-label", task.completed ? "Mark task active" : "Complete task");
    check.setAttribute("aria-pressed", String(task.completed));
    check.addEventListener("click", () => {
      task.completed = !task.completed;
      task.updatedAt = Date.now();
      saveTasks();
      render();
    });

    const body = document.createElement("div");
    body.className = "task-body";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "task-title";
    title.textContent = task.title;
    title.setAttribute("aria-label", "Edit " + task.title);
    title.addEventListener("click", () => editTask(item, task));
    body.append(title, metaFor(task));

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = document.createElement("button");
    edit.type = "button"; edit.className = "icon-button"; edit.textContent = "Edit"; edit.setAttribute("aria-label", "Edit " + task.title);
    edit.addEventListener("click", () => editTask(item, task));
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "icon-button danger"; remove.textContent = "Delete"; remove.setAttribute("aria-label", "Delete " + task.title);
    remove.addEventListener("click", () => {
      item.classList.add("removing");
      const finish = () => {
        tasks = tasks.filter(entry => entry.id !== task.id);
        saveTasks(); render();
      };
      if (reducedMotion) finish(); else setTimeout(finish, 180);
    });
    actions.append(edit, remove);
    item.append(check, body, actions);
    return item;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    byId("totalCount").textContent = total;
    byId("activeCount").textContent = total - completed;
    byId("completedCount").textContent = completed;
  }

  function render() {
    updateStats();
    list.replaceChildren();
    const visible = visibleTasks();
    const empty = byId("emptyState");
    empty.hidden = visible.length !== 0;

    if (!visible.length) return;
    const fragment = document.createDocumentFragment();
    visible.forEach(task => fragment.append(createTaskItem(task)));
    list.append(fragment);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) { input.focus(); return; }
    tasks.push({
      id: makeId(), title: title.slice(0, 240), completed: false,
      priority: byId("priorityInput").value,
      category: byId("categoryInput").value.trim().slice(0, 32),
      dueDate: byId("dueDateInput").value,
      createdAt: Date.now(), updatedAt: Date.now(), order: tasks.length
    });
    saveTasks();
    form.reset();
    byId("priorityInput").value = "normal";
    input.focus();
    render();
  });

  byId("searchInput").addEventListener("input", event => {
    query = event.target.value;
    render();
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  byId("sortSelect").addEventListener("change", event => {
    sort = event.target.value;
    render();
  });

  byId("markAll").addEventListener("click", () => {
    if (!tasks.length) return;
    tasks.forEach(task => { task.completed = true; task.updatedAt = Date.now(); });
    saveTasks(); render();
  });

  byId("clearCompleted").addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks(); render();
  });

  render();
})();