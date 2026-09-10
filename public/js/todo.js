(() => {
  "use strict";
  const KEY = "taskflow-todos-v1";
  const $ = id => document.getElementById(id);
  const form = $("todoForm"), input = $("todoInput"), list = $("todoList");
  if (!form || !input || !list) return;
  let tasks = load(), filter = "all", query = "", sort = "newest";
  const uid = () => crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function load() { try { const raw = localStorage.getItem(KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; } catch { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {} }
  function clean(t) { return { id: String(t.id || uid()), title: String(t.title || "").trim().slice(0,180), completed: !!t.completed, priority: ["low","normal","high"].includes(t.priority) ? t.priority : "normal", due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || "") ? t.due : "", created: Number(t.created) || Date.now() }; }
  tasks = tasks.map(clean).filter(t => t.title);
  function visible() {
    const q = query.trim().toLowerCase();
    return tasks.filter(t => (filter === "all" || (filter === "active" && !t.completed) || (filter === "completed" && t.completed)) && (!q || t.title.toLowerCase().includes(q))).sort((a,b) => {
      if (sort === "oldest") return a.created - b.created;
      if (sort === "priority") return ({high:0,normal:1,low:2}[a.priority] - {high:0,normal:1,low:2}[b.priority]) || b.created-a.created;
      if (sort === "due") return (a.due || "9999-99-99").localeCompare(b.due || "9999-99-99") || b.created-a.created;
      if (sort === "alpha") return a.title.localeCompare(b.title);
      return b.created-a.created;
    });
  }
  function dateLabel(value) { if (!value) return ""; return new Date(value + "T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
  function overdue(t) { return t.due && !t.completed && t.due < new Date().toISOString().slice(0,10); }
  function taskItem(t) {
    const li = document.createElement("li"); li.className = `task ${t.completed ? "done" : ""}`;
    const check = document.createElement("button"); check.className = "check"; check.type = "button"; check.textContent = t.completed ? "✓" : ""; check.setAttribute("aria-label", t.completed ? "Reopen task" : "Complete task"); check.setAttribute("aria-pressed", String(t.completed));
    check.onclick = () => { t.completed = !t.completed; save(); render(); };
    const content = document.createElement("div"); content.className = "task-content";
    const title = document.createElement("button"); title.type = "button"; title.className = "task-title"; title.textContent = t.title; title.onclick = () => edit(li,t); content.append(title);
    const meta = document.createElement("div"); meta.className = "meta";
    const p = document.createElement("span"); p.className = `priority ${t.priority}`; p.textContent = t.priority; meta.append(p);
    if (t.due) { const d = document.createElement("span"); d.className = overdue(t) ? "overdue" : ""; d.textContent = `${overdue(t) ? "Overdue · " : "Due · "}${dateLabel(t.due)}`; meta.append(d); }
    content.append(meta);
    const actions = document.createElement("div"); actions.className = "actions";
    const editBtn = document.createElement("button"); editBtn.type="button"; editBtn.textContent="Edit"; editBtn.onclick=()=>edit(li,t);
    const del = document.createElement("button"); del.type="button"; del.className="danger"; del.textContent="Delete"; del.onclick=()=>{ tasks=tasks.filter(x=>x.id!==t.id); save(); render(); };
    actions.append(editBtn,del); li.append(check,content,actions); return li;
  }
  function edit(li,t) {
    if (li.classList.contains("editing")) return; li.classList.add("editing"); const box=document.createElement("form"); box.className="editor";
    const title=document.createElement("input"); title.value=t.title; title.maxLength=180; title.setAttribute("aria-label","Task title");
    const priority=document.createElement("select"); ["low","normal","high"].forEach(v=>{const o=new Option(v[0].toUpperCase()+v.slice(1),v);o.selected=v===t.priority;priority.add(o);});
    const due=document.createElement("input"); due.type="date"; due.value=t.due; due.setAttribute("aria-label","Due date");
    const saveBtn=document.createElement("button"); saveBtn.type="submit"; saveBtn.textContent="Save"; const cancel=document.createElement("button"); cancel.type="button"; cancel.textContent="Cancel";
    box.append(title,priority,due,saveBtn,cancel); li.querySelector(".task-content").replaceChildren(box); title.focus(); title.select();
    box.onsubmit=e=>{e.preventDefault();const v=title.value.trim();if(!v)return;Object.assign(t,{title:v.slice(0,180),priority:priority.value,due:due.value});save();render();}; cancel.onclick=render;
  }
  function stats() { const done=tasks.filter(t=>t.completed).length; $("totalCount").textContent=tasks.length; $("activeCount").textContent=tasks.length-done; $("completedCount").textContent=done; $("resultLabel").textContent=`${visible().length} ${visible().length===1?"task":"tasks"}`; }
  function render() { stats(); list.replaceChildren(); const items=visible(); $("emptyState").hidden=items.length>0; const frag=document.createDocumentFragment(); items.forEach(t=>frag.append(taskItem(t))); list.append(frag); }
  form.onsubmit=e=>{e.preventDefault();const title=input.value.trim();if(!title){input.focus();return;}tasks.push(clean({id:uid(),title,priority:$("priorityInput").value,due:$("dueDateInput").value,created:Date.now()}));save();form.reset();$("priorityInput").value="normal";input.focus();render();};
  $("searchInput").oninput=e=>{query=e.target.value;render();};
  document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{const a=x===b;x.classList.toggle("active",a);x.setAttribute("aria-pressed",String(a));});render();});
  $("sortSelect").onchange=e=>{sort=e.target.value;render();};
  $("markAll").onclick=()=>{tasks.forEach(t=>t.completed=true);save();render();};
  $("clearCompleted").onclick=()=>{tasks=tasks.filter(t=>!t.completed);save();render();};
  render();
})();