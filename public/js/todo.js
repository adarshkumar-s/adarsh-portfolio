(() => {
  "use strict";
  const STORAGE_KEY="adarsh-todos";
  const form=document.getElementById("todoForm"),input=document.getElementById("todoInput");
  const priorityInput=document.getElementById("priorityInput"),categoryInput=document.getElementById("categoryInput"),dueDateInput=document.getElementById("dueDateInput");
  const searchInput=document.getElementById("searchInput"),sortSelect=document.getElementById("sortSelect"),list=document.getElementById("todoList"),emptyState=document.getElementById("emptyState");
  const clearCompleted=document.getElementById("clearCompleted"),markAll=document.getElementById("markAll");
  const totalCount=document.getElementById("totalCount"),activeCount=document.getElementById("activeCount"),completedCount=document.getElementById("completedCount");
  let filter="all",search="",sort="created",todos=loadTodos();
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function uid(){return window.crypto?.randomUUID?.()||"todo-"+Date.now().toString(36)+Math.random().toString(36).slice(2)}
  function normalize(todo,index){
    if(!todo||typeof todo!=="object")return null;
    const title=typeof todo.title==="string"?todo.title.trim():""; if(!title)return null;
    const completed=Boolean(todo.completed??todo.done),createdAt=Number(todo.createdAt)||Date.now()+index;
    return {id:String(todo.id||uid()),title:title.slice(0,240),completed,priority:["low","normal","high"].includes(todo.priority)?todo.priority:"normal",category:typeof todo.category==="string"?todo.category.slice(0,32):"",dueDate:typeof todo.dueDate==="string"?todo.dueDate:"",createdAt,updatedAt:Number(todo.updatedAt)||createdAt,order:Number.isFinite(todo.order)?todo.order:index};
  }
  function loadTodos(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return [];const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed.map(normalize).filter(Boolean):[]}catch{return []}}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(todos))}catch{}}
  function rank(p){return p==="high"?0:p==="normal"?1:2}
  function visibleTodos(){
    const q=search.trim().toLowerCase();
    return todos.filter(t=>(filter==="all"||(filter==="active"&&!t.completed)||(filter==="completed"&&t.completed))&&(!q||t.title.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.priority.includes(q)))
      .sort((a,b)=>sort==="oldest"?a.createdAt-b.createdAt:sort==="priority"?rank(a.priority)-rank(b.priority)||b.createdAt-a.createdAt:sort==="due"?(!a.dueDate?1:!b.dueDate?-1:a.dueDate.localeCompare(b.dueDate)):sort==="alphabetical"?a.title.localeCompare(b.title):b.createdAt-a.createdAt);
  }
  function dueLabel(date){if(!date)return "";const d=new Date(date+"T00:00:00");return Number.isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}
  function overdue(t){return t.dueDate&&!t.completed&&t.dueDate<new Date().toISOString().slice(0,10)}
  function stats(){const done=todos.filter(t=>t.completed).length;totalCount.textContent=todos.length;activeCount.textContent=todos.length-done;completedCount.textContent=done;markAll.disabled=!todos.length||done===todos.length;clearCompleted.disabled=!done}
  function edit(li,t,titleNode){
    if(li.classList.contains("editing"))return;li.classList.add("editing");
    const editor=document.createElement("form");editor.className="inline-editor";
    const ti=document.createElement("input");ti.value=t.title;ti.maxLength=240;ti.setAttribute("aria-label","Edit task");
    const pr=document.createElement("select");["low","normal","high"].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v[0].toUpperCase()+v.slice(1);o.selected=v===t.priority;pr.append(o)});
    const ca=document.createElement("input");ca.value=t.category;ca.maxLength=32;ca.placeholder="Category";ca.setAttribute("aria-label","Edit category");
    const du=document.createElement("input");du.type="date";du.value=t.dueDate;du.setAttribute("aria-label","Edit due date");
    const saveBtn=document.createElement("button");saveBtn.type="submit";saveBtn.textContent="Save";
    const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel";
    editor.append(ti,pr,ca,du,saveBtn,cancel);li.querySelector(".task-body").replaceChildren(editor);
    const finish=()=>{const v=ti.value.trim();if(!v){ti.focus();return}Object.assign(t,{title:v,priority:pr.value,category:ca.value.trim().slice(0,32),dueDate:du.value,updatedAt:Date.now()});save();render()};
    editor.addEventListener("submit",e=>{e.preventDefault();finish()});cancel.addEventListener("click",render);ti.addEventListener("keydown",e=>{if(e.key==="Escape")render()});ti.focus();ti.select();
  }
  function createItem(t){
    const li=document.createElement("li");li.className="todo-item"+(t.completed?" done":"");li.dataset.id=t.id;
    const check=document.createElement("button");check.type="button";check.className="check";check.textContent=t.completed?"✓":"";check.setAttribute("aria-label",t.completed?"Mark "+t.title+" active":"Complete "+t.title);check.setAttribute("aria-pressed",t.completed);
    const body=document.createElement("div");body.className="task-body";const title=document.createElement("span");title.className="task-title";title.textContent=t.title;
    const meta=document.createElement("div");meta.className="task-meta";
    if(t.priority!=="normal"){const p=document.createElement("span");p.className="priority "+t.priority;p.textContent=t.priority;meta.append(p)}
    if(t.category){const c=document.createElement("span");c.className="category";c.textContent=t.category;meta.append(c)}
    if(t.dueDate){const d=document.createElement("span");d.className="due"+(overdue(t)?" overdue":"");d.textContent=(overdue(t)?"Overdue · ":"Due · ")+dueLabel(t.dueDate);meta.append(d)}
    const ed=document.createElement("button");ed.type="button";ed.className="item-action edit";ed.textContent="Edit";ed.setAttribute("aria-label","Edit "+t.title);
    const del=document.createElement("button");del.type="button";del.className="item-action delete";del.textContent="×";del.setAttribute("aria-label","Delete "+t.title);
    check.onclick=()=>{t.completed=!t.completed;t.updatedAt=Date.now();save();render()};
    ed.onclick=()=>edit(li,t,title);title.ondblclick=()=>edit(li,t,title);
    del.onclick=()=>{li.classList.add("removing");const remove=()=>{todos=todos.filter(x=>x.id!==t.id);save();render()};reduceMotion?remove():setTimeout(remove,180)};
    body.append(title,meta);li.append(check,body,ed,del);return li;
  }
  function render(){
    const shown=visibleTodos();list.replaceChildren(...shown.map(createItem));emptyState.hidden=shown.length>0;
    if(!shown.length)emptyState.querySelector("strong").textContent=search||filter!=="all"?"No matching tasks":"No tasks here";stats();
  }
  form.addEventListener("submit",e=>{e.preventDefault();const title=input.value.trim();if(!title){input.focus();return}const now=Date.now();todos.push({id:uid(),title:title.slice(0,240),completed:false,priority:priorityInput.value,category:categoryInput.value.trim().slice(0,32),dueDate:dueDateInput.value,createdAt:now,updatedAt:now,order:todos.length});save();input.value="";categoryInput.value="";dueDateInput.value="";priorityInput.value="normal";render();input.focus()});
  document.querySelectorAll(".filters button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render()}));
  searchInput.addEventListener("input",()=>{search=searchInput.value;render()});sortSelect.addEventListener("change",()=>{sort=sortSelect.value;render()});
  markAll.addEventListener("click",()=>{const now=Date.now();todos.forEach(t=>{t.completed=true;t.updatedAt=now});save();render()});
  clearCompleted.addEventListener("click",()=>{todos=todos.filter(t=>!t.completed);save();render()});
  render();
})();