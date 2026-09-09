(() => {
  "use strict";

  const STORAGE_KEY = "adarsh-todos";
  const legacyKeys = ["todos", "todoList", "todo-items"];
  const $ = id => document.getElementById(id);

  const form = $("todoForm");
  const input = $("todoInput");
  const priorityInput = $("priorityInput");
  const categoryInput = $("categoryInput");
  const dueDateInput = $("dueDateInput");
  const searchInput = $("searchInput");
  const sortSelect = $("sortSelect");
  const list = $("todoList");
  const emptyState = $("emptyState");
  const clearCompleted = $("clearCompleted");
  const markAll = $("markAll");
  const totalCount = $("totalCount");
  const activeCount = $("activeCount");
  const completedCount = $("completedCount");

  if (!form || !input || !list) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let filter = "all";
  let search = "";
  let sort = "created";
  let todos = loadTodos();

  function uid() {
    return window.crypto?.randomUUID?.() ||
      "todo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function normalize(todo, index) {
    if (!todo || typeof todo !== "object") return null;
    const title = typeof todo.title === "string" ? todo.title.trim() : "";
    if (!title) return null;

    const createdAt = Number(todo.createdAt) || Date.now() + index;
    const updatedAt = Number(todo.updatedAt) || createdAt;
    return {
      id: String(todo.id || uid()),
      title: title.slice(0, 240),
      completed: Boolean(todo.completed ?? todo.done),
      priority: ["low", "normal", "high"].includes(todo.priority) ? todo.priority : "normal",
      category: typeof todo.category === "string" ? todo.category.trim().slice(0, 32) : "",
      dueDate: typeof todo.dueDate === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(todo.dueDate) ? todo.dueDate : "",
      createdAt,
      updatedAt,
      order: Number.isFinite(Number(todo.order)) ? Number(todo.order) : index
    };
  }

  function parseStored(raw) {
    try {
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.todos) ? parsed.todos : [];
      return source.map(normalize).filter(Boolean);
    } catch {
      return null;
    }
  }

  function loadTodos() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== null) return parseStored(current) || [];

      for (const key of legacyKeys) {
        const legacy = localStorage.getItem(key);
        if (legacy === null) continue;
        const migrated = parseStored(legacy);
        if (migrated?.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {
      // Private/restricted storage should never prevent the app from opening.
    }
    return [];
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // The UI remains usable when storage is unavailable.
    }
  }

  function priorityRank(priority) {
    return priority === "high" ? 0 : priority === "normal" ? 1 : 2;
  }

  function visibleTodos() {
    const q = search.trim().toLowerCase();

    return todos
      .filter(todo => {
        const matchesFilter =
          filter === "all" ||
          (filter === "active" && !todo.completed) ||
          (filter === "completed" && todo.completed);

        const matchesSearch =
          !q ||
          todo.title.toLowerCase().includes(q) ||
          todo.category.toLowerCase().includes(q) ||
          todo.priority.includes(q);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.createdAt - b.createdAt;
        if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority) || b.createdAt - a.createdAt;
        if (sort === "due") return (!a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.localeCompare(b.dueDate)) || b.createdAt - a.createdAt;
        if (sort === "alphabetical") return a.title.localeCompare(b.title);
        return b.createdAt - a.createdAt;
      });
  }

  function dueLabel(date) {
    if (!date) return "";
    const d = new Date(date + "T00:00:00");
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function isOverdue(todo) {
    return Boolean(todo.dueDate && !todo.completed && todo.dueDate < new Date().toISOString().slice(0, 10));
  }

  function stats() {
    const done = todos.filter(todo => todo.completed).length;
    totalCount.textContent = String(todos.length);
    activeCount.textContent = String(todos.length - done);
    completedCount.textContent = String(done);
    if (markAll) markAll.disabled = !todos.length || done === todos.length;
    if (clearCompleted) clearCompleted.disabled = !done;
  }

  function replaceTaskContent(li, todo) {
    const body = li.querySelector(".task-body");
    if (!body) return;

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = todo.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    if (todo.priority !== "normal") {
      const p = document.createElement("span");
      p.className = "priority " + todo.priority;
      p.textContent = todo.priority;
      meta.append(p);
    }
    if (todo.category) {
      const c = document.createElement("span");
      c.className = "category";
      c.textContent = todo.category;
      meta.append(c);
    }
    if (todo.dueDate) {
      const d = document.createElement("span");
      d.className = "due" + (isOverdue(todo) ? " overdue" : "");
      d.textContent = (isOverdue(todo) ? "Overdue · " : "Due · ") + dueLabel(todo.dueDate);
      meta.append(d);
    }

    body.replaceChildren(title, meta);
    title.ondblclick = () => startEdit(li, todo);
  }

  function startEdit(li, todo) {
    if (li.classList.contains("editing")) return;
    li.classList.add("editing");

    const editor = document.createElement("form");
    editor.className = "inline-editor";

    const title = document.createElement("input");
    title.value = todo.title;
    title.maxLength = 240;
    title.setAttribute("aria-label", "Edit task");

    const priority = document.createElement("select");
    ["low", "normal", "high"].forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value[0].toUpperCase() + value.slice(1);
      option.selected = value === todo.priority;
      priority.append(option);
    });

    const category = document.createElement("input");
    category.value = todo.category;
    category.maxLength = 32;
    category.placeholder = "Category";
    category.setAttribute("aria-label", "Edit category");

    const due = document.createElement("input");
    due.type = "date";
    due.value = todo.dueDate;
    due.setAttribute("aria-label", "Edit due date");

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    editor.append(title, priority, category, due, saveButton, cancelButton);
    li.querySelector(".task-body")?.replaceChildren(editor);

    const finish = () => {
      const value = title.value.trim();
      if (!value) {
        title.focus();
        return;
      }
      Object.assign(todo, {
        title: value.slice(0, 240),
        priority: priority.value,
        category: category.value.trim().slice(0, 32),
        dueDate: due.value,
        updatedAt: Date.now()
      });
      save();
      render();
    };

    editor.addEventListener("submit", event => {
      event.preventDefault();
      finish();
    });

    cancelButton.addEventListener("click", render);
    title.addEventListener("keydown", event => {
      if (event.key === "Escape") render();
    });

    title.focus();
    title.select();
  }

  function createItem(todo, index) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " done" : "");
    li.dataset.id = todo.id;
    li.draggable = true;

    const drag = document.createElement("span");
    drag.className = "drag-handle";
    drag.textContent = "⋮⋮";
    drag.setAttribute("aria-hidden", "true");
    drag.title = "Drag to reorder";

    const check = document.createElement("button");
    check.type = "button";
    check.className = "check";
    check.textContent = todo.completed ? "✓" : "";
    check.setAttribute("aria-label", todo.completed ? "Mark " + todo.title + " active" : "Complete " + todo.title);
    check.setAttribute("aria-pressed", String(todo.completed));

    const body = document.createElement("div");
    body.className = "task-body";
    replaceTaskContent({ querySelector: selector => selector === ".task-body" ? body : null }, todo);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "item-action edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + todo.title);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "item-action delete";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "Delete " + todo.title);

    check.addEventListener("click", () => {
      todo.completed = !todo.completed;
      todo.updatedAt = Date.now();
      save();
      render();
    });

    editButton.addEventListener("click", () => startEdit(li, todo));
    deleteButton.addEventListener("click", () => {
      const remove = () => {
        todos = todos.filter(item => item.id !== todo.id);
        save();
        render();
      };
      if (reduceMotion) remove();
      else {
        li.classList.add("removing");
        window.setTimeout(remove, 180);
      }
    });

    li.append(drag, check, body, editButton, deleteButton);

    li.addEventListener("dragstart", event => {
      li.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", todo.id);
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      list.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
      persistRenderedOrder();
    });

    li.addEventListener("dragover", event => {
      event.preventDefault();
      const dragging = list.querySelector(".dragging");
      if (!dragging || dragging === li) return;
      li.classList.add("drag-over");
      const rect = li.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      list.insertBefore(dragging, before ? li : li.nextSibling);
    });

    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", event => {
      event.preventDefault();
      li.classList.remove("drag-over");
      persistRenderedOrder();
    });

    return li;
  }

  function persistRenderedOrder() {
    const ids = [...list.querySelectorAll(".todo-item")].map(item => item.dataset.id);
    const rankById = new Map(ids.map((id, index) => [id, index]));
    todos.forEach(todo => {
      if (rankById.has(todo.id)) todo.order = rankById.get(todo.id);
    });
    save();
  }

  function render() {
    const shown = visibleTodos();
    list.replaceChildren(...shown.map(createItem));
    emptyState.hidden = shown.length > 0;

    if (!shown.length) {
      const strong = emptyState.querySelector("strong");
      if (strong) strong.textContent = search || filter !== "all" ? "No matching tasks" : "No tasks here";
    }

    stats();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }

    const now = Date.now();
    todos.push({
      id: uid(),
      title: title.slice(0, 240),
      completed: false,
      priority: priorityInput?.value || "normal",
      category: categoryInput?.value.trim().slice(0, 32) || "",
      dueDate: dueDateInput?.value || "",
      createdAt: now,
      updatedAt: now,
      order: todos.length
    });

    save();
    input.value = "";
    if (categoryInput) categoryInput.value = "";
    if (dueDateInput) dueDateInput.value = "";
    if (priorityInput) priorityInput.value = "normal";
    render();
    input.focus();
  });

  document.querySelectorAll(".filters button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filters button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      filter = button.dataset.filter || "all";
      render();
    });
  });

  searchInput?.addEventListener("input", () => {
    search = searchInput.value;
    render();
  });

  sortSelect?.addEventListener("change", () => {
    sort = sortSelect.value;
    render();
  });

  markAll?.addEventListener("click", () => {
    const now = Date.now();
    todos.forEach(todo => {
      todo.completed = true;
      todo.updatedAt = now;
    });
    save();
    render();
  });

  clearCompleted?.addEventListener("click", () => {
    todos = todos.filter(todo => !todo.completed);
    save();
    render();
  });

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    const incoming = parseStored(event.newValue || "[]");
    if (incoming) {
      todos = incoming;
      render();
    }
  });

  render();
})();