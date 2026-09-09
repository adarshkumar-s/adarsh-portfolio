(() => {
  const navItems=[["/","Home"],["/projects","Projects"],["/labs","Labs"],["/tools","Tools"],["/blog","Blog"],["/about","About"],["/stats","Stats"],["/contact","Contact"]];
  const current=location.pathname.replace(/\/$/,"")||"/";
  const navHost=document.getElementById("site-nav"),footerHost=document.getElementById("site-footer");
  if(navHost){
    const header=document.createElement("header");header.className="site-header";
    const wrap=document.createElement("div");wrap.className="shell nav";
    const brand=document.createElement("a");brand.className="brand";brand.href="/";brand.textContent="Adarsh.";
    const menu=document.createElement("button");menu.className="menu";menu.type="button";menu.setAttribute("aria-label","Open navigation");menu.setAttribute("aria-expanded","false");menu.textContent="☰";
    const nav=document.createElement("nav");nav.className="nav-links";nav.setAttribute("aria-label","Primary navigation");
    navItems.forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;if(current===href)a.setAttribute("aria-current","page");nav.appendChild(a)});
    menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close navigation":"Open navigation")});
    wrap.append(brand,menu,nav);header.append(wrap);navHost.replaceChildren(header);
  }
  if(footerHost){
    const footer=document.createElement("footer");footer.className="site-footer";const wrap=document.createElement("div");wrap.className="shell";
    const grid=document.createElement("div");grid.className="footer-grid";const identity=document.createElement("div");
    const brand=document.createElement("a");brand.className="brand";brand.href="/";brand.textContent="Adarsh.";
    const note=document.createElement("p");note.textContent="Current developer platform — projects, labs, tools and notes.";identity.append(brand,note);
    const links=document.createElement("div");links.className="footer-links";navItems.slice(1).forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;links.appendChild(a)});
    grid.append(identity,links);const bottom=document.createElement("div");bottom.className="footer-bottom";
    const year=document.createElement("span");year.textContent="© "+new Date().getFullYear()+" Adarsh Kumar";
    const archive=document.createElement("a");archive.href="/projects/previous-portfolio";archive.textContent="Previous portfolio →";
    bottom.append(year,archive);wrap.append(grid,bottom);footer.append(wrap);footerHost.replaceChildren(footer);
  }
  document.querySelectorAll('a[target="_blank"]').forEach(a=>a.rel="noopener noreferrer");
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse=window.matchMedia("(hover: none)").matches;

  const stage=document.getElementById("liquid-stage"),canvas=document.getElementById("liquid-canvas");
  if(stage&&canvas&&!reduce&&!coarse){
    const ctx=canvas.getContext("2d",{alpha:true});let dpr=Math.min(window.devicePixelRatio||1,2),w=0,h=0,last=0;const ripples=[];
    const resize=()=>{const r=stage.getBoundingClientRect();w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0)};
    const add=(x,y,force=1)=>{ripples.push({x,y,r:2,life:1,strength:force});if(ripples.length>24)ripples.shift()};
    stage.addEventListener("pointermove",e=>{const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;stage.style.setProperty("--mx",(x/r.width*100).toFixed(2)+"%");stage.style.setProperty("--my",(y/r.height*100).toFixed(2)+"%");if(Math.random()>.42)add(x,y,.75)},{passive:true});
    stage.addEventListener("pointerenter",e=>{const r=stage.getBoundingClientRect();add(e.clientX-r.left,e.clientY-r.top,1.2)});
    const draw=t=>{if(!last)last=t;const dt=Math.min(32,t-last);last=t;ctx.clearRect(0,0,w,h);
      for(let i=ripples.length-1;i>=0;i--){const q=ripples[i];q.r+=dt*.16*(1+q.strength);q.life-=dt*.00072;if(q.life<=0){ripples.splice(i,1);continue}
        ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.strokeStyle="rgba(190,180,255,"+(q.life*.22)+")";ctx.lineWidth=1.2+q.life*2;ctx.stroke();
        ctx.beginPath();ctx.arc(q.x,q.y,q.r*.72,0,Math.PI*2);ctx.strokeStyle="rgba(104,232,208,"+(q.life*.11)+")";ctx.lineWidth=.8;ctx.stroke();
      }requestAnimationFrame(draw)};
    resize();window.addEventListener("resize",resize,{passive:true});requestAnimationFrame(draw);
  }

  if(!reduce&&!coarse)document.querySelectorAll(".tilt-card,.project-art").forEach(card=>{
    card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty("--mx",(x*100+50)+"%");card.style.setProperty("--my",(y*100+50)+"%");if(card.classList.contains("tilt-card"))card.style.transform="perspective(900px) rotateX("+(-y*3).toFixed(2)+"deg) rotateY("+(x*3).toFixed(2)+"deg) translateY(-5px)"});
    card.addEventListener("pointerleave",()=>{card.style.transform=""});
  });

  if(!reduce&&"IntersectionObserver"in window){const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");io.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll(".js-reveal").forEach((el,i)=>{el.style.transitionDelay=Math.min(i*70,280)+"ms";io.observe(el)})}
  else document.querySelectorAll(".js-reveal").forEach(el=>el.classList.add("is-visible"));

  if(!reduce&&!coarse){
    const cursor=document.createElement("div");cursor.className="custom-cursor";document.body.appendChild(cursor);
    let tx=-100,ty=-100,x=-100,y=-100;
    const tick=()=>{x+=(tx-x)*.16;y+=(ty-y)*.16;cursor.style.transform="translate3d("+x+"px,"+y+"px,0) translate(-50%,-50%)";requestAnimationFrame(tick)};
    document.addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY},{passive:true});requestAnimationFrame(tick);
    document.querySelectorAll("a,.button,.tilt-card,.project-art").forEach(el=>{el.addEventListener("pointerenter",()=>cursor.classList.add("is-link"));el.addEventListener("pointerleave",()=>cursor.classList.remove("is-link"))});
  }
})();