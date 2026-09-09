(() => {
"use strict";
const KEY="adarsh-todos-v2", LEGACY_KEYS=["adarsh-todos","todos","todoList","todo-items"];
const $=id=>document.getElementById(id);
const form=$("todoForm"), input=$("todoInput"), list=$("todoList");
if(!form||!input||!list)return;
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let filter="all",query="",sort="created",tasks=[];
const makeId=()=>crypto.randomUUID?.()||"todo-"+Date.now().toString(36)+Math.random().toString(36).slice(2);
const normalize=(item,index)=>{
 if(!item||typeof item!=="object")return null;
 const title=typeof item.title==="string"?item.title.trim().slice(0,240):"";
 if(!title)return null;
 const createdAt=Number(item.createdAt)||Date.now()+index;
 return {id:String(item.id||makeId()),title,completed:Boolean(item.completed??item.done),
 priority:["low","normal","high"].includes(item.priority)?item.priority:"normal",
 category:typeof item.category==="string"?item.category.trim().slice(0,32):"",
 dueDate:typeof item.dueDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)?item.dueDate:"",
 createdAt,updatedAt:Number(item.updatedAt)||createdAt,order:Number.isFinite(Number(item.order))?Number(item.order):index};
};
const parse=raw=>{try{const data=JSON.parse(raw);const source=Array.isArray(data)?data:Array.isArray(data?.todos)?data.todos:[];return source.map(normalize).filter(Boolean)}catch{return null}};
function load(){
 try{
  const current=localStorage.getItem(KEY);
  if(current!==null){const parsed=parse(current);if(parsed)return parsed;}
  for(const key of LEGACY_KEYS){const raw=localStorage.getItem(key);if(raw===null)continue;const migrated=parse(raw);if(migrated){localStorage.setItem(KEY,JSON.stringify(migrated));return migrated;}}
 }catch{}
 return [];
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(tasks));$("storageMessage").hidden=true;return true}catch{$("storageMessage").textContent="Your browser could not save changes."; $("storageMessage").hidden=false;return false}}
const rank=p=>p==="high"?0:p==="normal"?1:2;
const shown=()=>{const q=query.trim().toLowerCase();return tasks.filter(t=>(filter==="all"||(filter==="active"&&!t.completed)||(filter==="completed"&&t.completed))&&(!q||[t.title,t.category,t.priority].some(v=>v.toLowerCase().includes(q)))).sort((a,b)=>{if(sort==="oldest")return a.createdAt-b.createdAt;if(sort==="priority")return rank(a.priority)-rank(b.priority)||b.createdAt-a.createdAt;if(sort==="due")return(a.dueDate||"9999-99-99").localeCompare(b.dueDate||"9999-99-99")||b.createdAt-a.createdAt;if(sort==="alphabetical")return a.title.localeCompare(b.title);return b.createdAt-a.createdAt})};
const dueText=v=>{if(!v)return"";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric"})};
const meta=t=>{const m=document.createElement("div");m.className="task-meta";if(t.priority!=="normal"){const p=document.createElement("span");p.className="priority "+t.priority;p.textContent=t.priority;m.append(p)}if(t.category){const c=document.createElement("span");c.textContent=t.category;m.append(c)}if(t.dueDate){const d=document.createElement("span");d.className="due"+(!t.completed&&t.dueDate<new Date().toISOString().slice(0,10)?" overdue":"");d.textContent=(d.classList.contains("overdue")?"Overdue · ":"Due · ")+dueText(t.dueDate);m.append(d)}return m};
function editTask(li,t){if(li.classList.contains("editing"))return;li.classList.add("editing");const editor=document.createElement("form");editor.className="inline-editor";const title=Object.assign(document.createElement("input"),{value:t.title,maxLength:240});title.setAttribute("aria-label","Task title");const priority=document.createElement("select");["low","normal","high"].forEach(v=>{const o=new Option(v[0].toUpperCase()+v.slice(1),v);o.selected=v===t.priority;priority.add(o)});priority.setAttribute("aria-label","Priority");const category=Object.assign(document.createElement("input"),{value:t.category,maxLength:32,placeholder:"Category"});category.setAttribute("aria-label","Category");const due=Object.assign(document.createElement("input"),{type:"date",value:t.dueDate});due.setAttribute("aria-label","Due date");const saveBtn=Object.assign(document.createElement("button"),{type:"submit",textContent:"Save"});const cancel=Object.assign(document.createElement("button"),{type:"button",textContent:"Cancel"});editor.append(title,priority,category,due,saveBtn,cancel);li.querySelector(".task-body").replaceChildren(editor);editor.addEventListener("submit",e=>{e.preventDefault();const value=title.value.trim();if(!value){title.focus();return}Object.assign(t,{title:value.slice(0,240),priority:priority.value,category:category.value.trim().slice(0,32),dueDate:due.value,updatedAt:Date.now()});save();render()});cancel.addEventListener("click",render);editor.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();render()}});title.focus();title.select()}
function makeItem(t){const li=document.createElement("li");li.className="todo-item"+(t.completed?" done":"");li.dataset.id=t.id;const check=Object.assign(document.createElement("button"),{type:"button",className:"check",textContent:t.completed?"✓":""});check.setAttribute("aria-label",t.completed?"Mark task active":"Complete task");const body=document.createElement("div");body.className="task-body";const title=document.createElement("span");title.className="task-title";title.textContent=t.title;body.append(title,meta(t));const edit=Object.assign(document.createElement("button"),{type:"button",className:"item-action edit",textContent:"Edit"});const del=Object.assign(document.createElement("button"),{type:"button",className:"item-action delete",textContent:"×"});edit.setAttribute("aria-label","Edit task");del.setAttribute("aria-label","Delete task");check.addEventListener("click",()=>{t.completed=!t.completed;t.updatedAt=Date.now();save();render()});edit.addEventListener("click",()=>editTask(li,t));del.addEventListener("click",()=>{const remove=()=>{tasks=tasks.filter(x=>x.id!==t.id);save();render()};if(reduceMotion)remove();else{li.classList.add("removing");setTimeout(remove,180)}});li.append(check,body,edit,del);return li}
function render(){const items=shown();list.replaceChildren(...items.map(makeItem));const empty=$("emptyState");empty.hidden=items.length>0;const s=empty.querySelector("strong");if(s)s.textContent=query||filter!=="all"?"No matching tasks":"No tasks here";const done=tasks.filter(t=>t.completed).length;$("totalCount").textContent=tasks.length;$("activeCount").textContent=tasks.length-done;$("completedCount").textContent=done;$("markAll").disabled=!tasks.length||done===tasks.length;$("clearCompleted").disabled=!done}
form.addEventListener("submit",e=>{e.preventDefault();const title=input.value.trim();if(!title){input.focus();return}const now=Date.now();tasks.push({id:makeId(),title:title.slice(0,240),completed:false,priority:$("priorityInput").value,category:$("categoryInput").value.trim().slice(0,32),dueDate:$("dueDateInput").value,createdAt:now,updatedAt:now,order:tasks.length});save();input.value="";$("categoryInput").value="";$("dueDateInput").value="";$("priorityInput").value="normal";render();input.focus()});
document.querySelectorAll(".filters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".filters button").forEach(b=>{b.classList.toggle("active",b===btn);b.setAttribute("aria-pressed",String(b===btn))});filter=btn.dataset.filter||"all";render()}));
$("searchInput").addEventListener("input",e=>{query=e.target.value;render()});$("sortSelect").addEventListener("change",e=>{sort=e.target.value;render()});
$("markAll").addEventListener("click",()=>{tasks.forEach(t=>{t.completed=true;t.updatedAt=Date.now()});save();render()});
$("clearCompleted").addEventListener("click",()=>{tasks=tasks.filter(t=>!t.completed);save();render()});
window.addEventListener("storage",e=>{if(e.key===KEY){const incoming=parse(e.newValue||"[]");if(incoming){tasks=incoming;render()}}});
window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("searchInput").focus()}if(e.key==="/"&&!["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)){e.preventDefault();$("searchInput").focus()}});
tasks=load();render();
})();