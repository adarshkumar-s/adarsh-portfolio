(() => {
  "use strict";

  const KEY = "adarsh-todos";
  const LEGACY_KEYS = ["todos", "todoList", "todo-items"];
  const $ = id => document.getElementById(id);
  const form = $("todoForm"), input = $("todoInput"), list = $("todoList");
  if (!form || !input || !list) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let filter = "all", query = "", sort = "created";
  let tasks = load();

  function id() {
    return crypto.randomUUID?.() || "todo-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function normalize(item, index) {
    if (!item || typeof item !== "object") return null;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 240) : "";
    if (!title) return null;
    const createdAt = Number(item.createdAt) || Date.now() + index;
    return {
      id: String(item.id || id()), title,
      completed: Boolean(item.completed ?? item.done),
      priority: ["low","normal","high"].includes(item.priority) ? item.priority : "normal",
      category: typeof item.category === "string" ? item.category.trim().slice(0,32) : "",
      dueDate: typeof item.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? item.dueDate : "",
      createdAt, updatedAt: Number(item.updatedAt) || createdAt,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index
    };
  }

  function parse(raw) {
    try {
      const data = JSON.parse(raw);
      const source = Array.isArray(data) ? data : Array.isArray(data?.todos) ? data.todos : [];
      return source.map(normalize).filter(Boolean);
    } catch { return null; }
  }

  function load() {
    try {
      const current = localStorage.getItem(KEY);
      if (current !== null) return parse(current) || [];
      for (const legacyKey of LEGACY_KEYS) {
        const raw = localStorage.getItem(legacyKey);
        if (raw === null) continue;
        const migrated = parse(raw);
        if (migrated) {
          localStorage.setItem(KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}
    return [];
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {}
  }

  function priorityRank(p) { return p === "high" ? 0 : p === "normal" ? 1 : 2; }

  function visible() {
    const q = query.trim().toLowerCase();
    return tasks.filter(t => {
      const f = filter === "all" || (filter === "active" && !t.completed) || (filter === "completed" && t.completed);
      const s = !q || [t.title,t.category,t.priority].some(v => v.toLowerCase().includes(q));
      return f && s;
    }).sort((a,b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority) || b.createdAt - a.createdAt;
      if (sort === "due") return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99") || b.createdAt - a.createdAt;
      if (sort === "alphabetical") return a.title.localeCompare(b.title);
      return b.createdAt - a.createdAt;
    });
  }

  function overdue(t) { return t.dueDate && !t.completed && t.dueDate < new Date().toISOString().slice(0,10); }
  function dueText(value) {
    if (!value) return "";
    const d = new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }

  function makeMeta(t) {
    const meta = document.createElement("div");
    meta.className = "task-meta";
    if (t.priority !== "normal") {
      const p = document.createElement("span");
      p.className = "priority " + t.priority; p.textContent = t.priority; meta.append(p);
    }
    if (t.category) {
      const c = document.createElement("span"); c.textContent = t.category; meta.append(c);
    }
    if (t.dueDate) {
      const d = document.createElement("span");
      d.className = overdue(t) ? "due overdue" : "due";
      d.textContent = (overdue(t) ? "Overdue · " : "Due · ") + dueText(t.dueDate); meta.append(d);
    }
    return meta;
  }

  function editTask(li,t) {
    if (li.classList.contains("editing")) return;
    li.classList.add("editing");
    const editor = document.createElement("form");
    editor.className = "inline-editor";
    const title = Object.assign(document.createElement("input"),{value:t.title,maxLength:240});
    title.setAttribute("aria-label","Task title");
    const priority = document.createElement("select");
    ["low","normal","high"].forEach(v => {
      const o = new Option(v[0].toUpperCase()+v.slice(1),v); o.selected = v === t.priority; priority.add(o);
    });
    const category = Object.assign(document.createElement("input"),{value:t.category,maxLength:32,placeholder:"Category"});
    category.setAttribute("aria-label","Category");
    const due = Object.assign(document.createElement("input"),{type:"date",value:t.dueDate});
    due.setAttribute("aria-label","Due date");
    const saveBtn = Object.assign(document.createElement("button"),{type:"submit",textContent:"Save"});
    const cancel = Object.assign(document.createElement("button"),{type:"button",textContent:"Cancel"});
    editor.append(title,priority,category,due,saveBtn,cancel);
    const body = li.querySelector(".task-body"); body.replaceChildren(editor);
    editor.addEventListener("submit",e => {
      e.preventDefault();
      const value = title.value.trim();
      if (!value) { title.focus(); return; }
      Object.assign(t,{title:value.slice(0,240),priority:priority.value,category:category.value.trim().slice(0,32),dueDate:due.value,updatedAt:Date.now()});
      save(); render();
    });
    cancel.addEventListener("click",render);
    title.addEventListener("keydown",e => { if(e.key==="Escape") render(); });
    title.focus(); title.select();
  }

  function item(t) {
    const li = document.createElement("li");
    li.className = "todo-item" + (t.completed ? " done" : "");
    li.dataset.id = t.id;

    const check = Object.assign(document.createElement("button"),{type:"button",className:"check",textContent:t.completed?"✓":""});
    check.setAttribute("aria-label",t.completed ? "Mark task active" : "Complete task");
    const body = document.createElement("div"); body.className="task-body";
    const title = document.createElement("span"); title.className="task-title"; title.textContent=t.title;
    body.append(title,makeMeta(t));

    const edit = Object.assign(document.createElement("button"),{type:"button",className:"item-action edit",textContent:"Edit"});
    const del = Object.assign(document.createElement("button"),{type:"button",className:"item-action delete",textContent:"×"});
    edit.setAttribute("aria-label","Edit task"); del.setAttribute("aria-label","Delete task");

    check.addEventListener("click",()=>{t.completed=!t.completed;t.updatedAt=Date.now();save();render();});
    edit.addEventListener("click",()=>editTask(li,t));
    del.addEventListener("click",()=>{
      const remove=()=>{tasks=tasks.filter(x=>x.id!==t.id);save();render();};
      if(reduceMotion) remove(); else {li.classList.add("removing");setTimeout(remove,180);}
    });
    li.append(check,body,edit,del);
    return li;
  }

  function render() {
    const shown = visible();
    list.replaceChildren(...shown.map(item));
    const empty=$("emptyState"); if(empty) {
      empty.hidden=shown.length>0;
      const strong=empty.querySelector("strong");
      if(strong) strong.textContent=query||filter!=="all"?"No matching tasks":"No tasks here";
    }
    const done=tasks.filter(t=>t.completed).length;
    $("totalCount").textContent=tasks.length;
    $("activeCount").textContent=tasks.length-done;
    $("completedCount").textContent=done;
    $("markAll").disabled=!tasks.length || done===tasks.length;
    $("clearCompleted").disabled=!done;
  }

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const title=input.value.trim();
    if(!title){input.focus();return;}
    const now=Date.now();
    tasks.push({
      id:id(),title:title.slice(0,240),completed:false,
      priority:$("priorityInput")?.value||"normal",
      category:$("categoryInput")?.value.trim().slice(0,32)||"",
      dueDate:$("dueDateInput")?.value||"",createdAt:now,updatedAt:now,order:tasks.length
    });
    save(); input.value=""; $("categoryInput").value=""; $("dueDateInput").value=""; $("priorityInput").value="normal"; render(); input.focus();
  });

  document.querySelectorAll(".filters button").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".filters button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); filter=btn.dataset.filter||"all"; render();
  }));
  $("searchInput")?.addEventListener("input",e=>{query=e.target.value;render();});
  $("sortSelect")?.addEventListener("change",e=>{sort=e.target.value;render();});
  $("markAll")?.addEventListener("click",()=>{tasks.forEach(t=>{t.completed=true;t.updatedAt=Date.now();});save();render();});
  $("clearCompleted")?.addEventListener("click",()=>{tasks=tasks.filter(t=>!t.completed);save();render();});
  addEventListener("storage",e=>{if(e.key===KEY){const incoming=parse(e.newValue||"[]");if(incoming){tasks=incoming;render();}}});
  addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("searchInput")?.focus();}
    if(e.key==="/" && document.activeElement?.tagName!=="INPUT"){e.preventDefault();$("searchInput")?.focus();}
  });
  render();
})();