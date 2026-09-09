// DOM Element Selectors
const addTodoBtn = document.getElementById("addTodoBtn");
const inputTag = document.getElementById("todoInput");
const todoListUl = document.getElementById("todoList");
const itemsLeft = document.getElementById("itemsLeft");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = [];
let currentFilter = "all";

// Load todos from localStorage on startup
const todosString = localStorage.getItem("todos");
if (todosString) {
  try {
    todos = JSON.parse(todosString);
  } catch (e) {
    todos = [];
  }
}

// Save todos state to localStorage
const saveTodos = () => {
  localStorage.setItem("todos", JSON.stringify(todos));
};

// Render todos dynamically based on the current filter
const populateTodos = () => {
  let filteredTodos = todos;

  if (currentFilter === "active") {
    filteredTodos = todos.filter((todo) => !todo.isCompleted);
  } else if (currentFilter === "completed") {
    filteredTodos = todos.filter((todo) => todo.isCompleted);
  }

  todoListUl.innerHTML = filteredTodos
    .map(
      (todo) => `
        <li class="todo-item ${todo.isCompleted ? "completed" : ""}" data-id="${todo.id}">
            <input 
                type="checkbox" 
                class="todo-checkbox"
                ${todo.isCompleted ? "checked" : ""}
            >
            <span class="todo-text">${escapeHtml(todo.title)}</span>
            <button class="delete-btn" aria-label="Delete task">&times;</button>
        </li>
      `
    )
    .join("");

  updateItemsLeft();
};

// Helper to escape HTML characters in todo titles
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Update the active items counter
const updateItemsLeft = () => {
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const count = activeTodos.length;
  itemsLeft.textContent = `${count} ${count === 1 ? "item" : "items"} left`;
};

// Add a new todo item
const addTodo = () => {
  const todoText = inputTag.value.trim();

  if (todoText === "") return;

  const newTodo = {
    id: Date.now(),
    title: todoText,
    isCompleted: false
  };

  todos.push(newTodo);
  saveTodos();
  inputTag.value = "";
  populateTodos();
};

// Event Listeners for adding todos
addTodoBtn.addEventListener("click", addTodo);

inputTag.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodo();
  }
});

// Event Delegation for Checkbox toggle & Single-item Delete
todoListUl.addEventListener("click", (event) => {
  const todoItem = event.target.closest(".todo-item");
  if (!todoItem) return;

  const id = Number(todoItem.dataset.id);

  // Toggle completion status
  if (event.target.classList.contains("todo-checkbox")) {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (targetTodo) {
      targetTodo.isCompleted = event.target.checked;
      saveTodos();
      populateTodos();
    }
  }

  // Delete specific todo
  if (event.target.classList.contains("delete-btn")) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    populateTodos();
  }
});

// Filter selection tabs
filterBtns.forEach((button) => {
  button.addEventListener("click", () => {
    filterBtns.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentFilter = button.dataset.filter;
    populateTodos();
  });
});

// Clear all completed tasks
clearCompletedBtn.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.isCompleted);
  saveTodos();
  populateTodos();
});

// Initial Render
populateTodos();