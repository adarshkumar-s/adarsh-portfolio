(() => {
"use strict";

const STORE="adarsh-todos-v2";
const LEGACY=["adarsh-todos","todos","todoList","todo-items"];
const $=id=>document.getElementById(id);
const form=$("todoForm"), input=$("todoInput"), list=$("todoList");
if(!form||!input||!list) return;

const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let tasks=load(), filter="all", query="", sort="created";

function uid(){return globalThis.crypto?.randomUUID?.()||"todo-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
function cleanDate(v){return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:""}
function normalize(raw,index=0){
  if(!raw||typeof raw!=="object") return null;
  const title=typeof raw.title==="string"?raw.title.trim().slice(0,240):typeof raw.text==="string"?raw.text.trim().slice(0,240):"";
  if(!title) return null;
  const created=Number(raw.createdAt)||Date.now()+index;
  return {
    id:String(raw.id||uid()), title, completed:Boolean(raw.completed??raw.done),
    priority:["low","normal","high"].includes(raw.priority)?raw.priority:"normal",
    category:typeof raw.category==="string"?raw.category.trim().slice(0,32):"",
    dueDate:cleanDate(raw.dueDate), createdAt:created, updatedAt:Number(raw.updatedAt)||created,
    order:Number.isFinite(Number(raw.order))?Number(raw.order):index
  };
}
function parse(raw){
  try{
    const value=JSON.parse(raw);
    const source=Array.isArray(value)?value:Array.isArray(value?.todos)?value.todos:[];
    return source.map(normalize).filter(Boolean);
  }catch{return null}
}
function load(){
  try{
    const current=localStorage.getItem(STORE);
    if(current!==null) return parse(current)||[];
    for(const key of LEGACY){
      const raw=localStorage.getItem(key); if(raw===null) continue;
      const migrated=parse(raw); if(migrated){localStorage.setItem(STORE,JSON.stringify(migrated));return migrated}
    }
  }catch{}
  return []
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(tasks))}catch{}}
function rank(p){return p==="high"?0:p==="normal"?1:2}
function shown(){
  const q=query.trim().toLowerCase();
  return tasks.filter(t=>{
    const okFilter=filter==="all"||(filter==="active"&&!t.completed)||(filter==="completed"&&t.completed);
    const hay=[t.title,t.category,t.priority].join(" ").toLowerCase();
    return okFilter&&(!q||hay.includes(q));
  }).sort((a,b)=>{
    if(sort==="oldest") return a.createdAt-b.createdAt;
    if(sort==="priority") return rank(a.priority)-rank(b.priority)||b.createdAt-a.createdAt;
    if(sort==="due") return (a.dueDate||"9999-12-31").localeCompare(b.dueDate||"9999-12-31")||b.createdAt-a.createdAt;
    if(sort==="alphabetical") return a.title.localeCompare(b.title);
    return b.createdAt-a.createdAt;
  })
}
function dueLabel(v){
  if(!v) return "";
  const d=new Date(v+"T00:00:00");
  return Number.isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric"})
}
function isOverdue(t){return !!t.dueDate&&!t.completed&&t.dueDate<new Date().toISOString().slice(0,10)}
function meta(t){
  const box=document.createElement("div");box.className="meta";
  if(t.priority!=="normal"){const x=document.createElement("span");x.className="priority "+t.priority;x.textContent=t.priority;box.append(x)}
  if(t.category){const x=document.createElement("span");x.textContent=t.category;box.append(x)}
  if(t.dueDate){const x=document.createElement("span");x.className=isOverdue(t)?"due overdue":"due";x.textContent=(isOverdue(t)?"Overdue · ":"Due · ")+dueLabel(t.dueDate);box.append(x)}
  return box
}
function edit(li,t){
  if(li.classList.contains("editing"))return;
  li.classList.add("editing");
  const f=document.createElement("form");f.className="editor";
  const title=Object.assign(document.createElement("input"),{value:t.title,maxLength:240});title.setAttribute("aria-label","Task title");
  const p=document.createElement("select");["low","normal","high"].forEach(v=>{const o=new Option(v[0].toUpperCase()+v.slice(1),v);o.selected=v===t.priority;p.add(o)});
  const c=Object.assign(document.createElement("input"),{value:t.category,maxLength:32,placeholder:"Category"});c.setAttribute("aria-label","Category");
  const d=Object.assign(document.createElement("input"),{type:"date",value:t.dueDate});d.setAttribute("aria-label","Due date");
  const s=Object.assign(document.createElement("button"),{type:"submit",textContent:"Save"});
  const cancel=Object.assign(document.createElement("button"),{type:"button",textContent:"Cancel"});
  f.append(title,p,c,d,s,cancel);li.querySelector(".body").replaceChildren(f);
  f.addEventListener("submit",e=>{e.preventDefault();const v=title.value.trim();if(!v){title.focus();return}Object.assign(t,{title:v.slice(0,240),priority:p.value,category:c.value.trim().slice(0,32),dueDate:d.value,updatedAt:Date.now()});save();render()});
  cancel.addEventListener("click",render);title.addEventListener("keydown",e=>{if(e.key==="Escape")render()});title.focus();title.select()
}
function row(t){
  const li=document.createElement("li");li.className="task"+(t.completed?" done":"");li.dataset.id=t.id;
  const check=Object.assign(document.createElement("button"),{type:"button",className:"check",textContent:t.completed?"✓":""});check.setAttribute("aria-label",t.completed?"Mark task active":"Complete task");
  const body=document.createElement("div");body.className="body";
  const title=document.createElement("span");title.className="title";title.textContent=t.title;body.append(title,meta(t));
  const editBtn=Object.assign(document.createElement("button"),{type:"button",className:"action",textContent:"Edit"});editBtn.setAttribute("aria-label","Edit task");
  const del=Object.assign(document.createElement("button"),{type:"button",className:"action delete",textContent:"×"});del.setAttribute("aria-label","Delete task");
  check.addEventListener("click",()=>{t.completed=!t.completed;t.updatedAt=Date.now();save();render()});
  editBtn.addEventListener("click",()=>edit(li,t));
  del.addEventListener("click",()=>{const remove=()=>{tasks=tasks.filter(x=>x.id!==t.id);save();render()};if(reduce)remove();else{li.classList.add("removing");setTimeout(remove,180)}});
  li.append(check,body,editBtn,del);return li
}
function render(){
  const rows=shown();list.replaceChildren(...rows.map(row));
  const empty=$("emptyState");empty.hidden=rows.length>0;
  const heading=empty.querySelector("strong");heading.textContent=query||filter!=="all"?"No matching tasks":"No tasks here";
  const done=tasks.filter(t=>t.completed).length;
  $("totalCount").textContent=tasks.length;$("activeCount").textContent=tasks.length-done;$("completedCount").textContent=done;
  $("markAll").disabled=!tasks.length||done===tasks.length;$("clearCompleted").disabled=!done;
}
form.addEventListener("submit",e=>{
  e.preventDefault();const title=input.value.trim();if(!title){input.focus();return}
  const now=Date.now();tasks.push({id:uid(),title:title.slice(0,240),completed:false,priority:$("priorityInput").value,category:$("categoryInput").value.trim().slice(0,32),dueDate:$("dueDateInput").value,createdAt:now,updatedAt:now,order:tasks.length});
  save();form.reset();$("priorityInput").value="normal";render();input.focus()
});
document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{
  filter=btn.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>{const active=b===btn;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});render()
}));
$("searchInput").addEventListener("input",e=>{query=e.target.value;render()});
$("sortSelect").addEventListener("change",e=>{sort=e.target.value;render()});
$("markAll").addEventListener("click",()=>{tasks.forEach(t=>{t.completed=true;t.updatedAt=Date.now()});save();render()});
$("clearCompleted").addEventListener("click",()=>{tasks=tasks.filter(t=>!t.completed);save();render()});
addEventListener("storage",e=>{if(e.key===STORE){const next=parse(e.newValue||"[]");if(next){tasks=next;render()}}});
addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("searchInput").focus()}if(e.key==="/"&&!["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)){e.preventDefault();$("searchInput").focus()}});
render();
})();