(() => {
  const navItems=[["/","Home"],["/projects","Projects"],["/labs","Labs"],["/tools","Tools"],["/blog","Blog"],["/about","About"],["/stats","Stats"],["/contact","Contact"]];
  const current=location.pathname.replace(/\/$/,"")||"/";
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse=window.matchMedia("(hover: none)").matches;

  const navHost=document.getElementById("site-nav");
  if(navHost){
    const header=document.createElement("header"); header.className="site-header";
    const wrap=document.createElement("div"); wrap.className="shell nav";
    const brand=document.createElement("a"); brand.className="brand"; brand.href="/"; brand.textContent="Adarsh.";
    const menu=document.createElement("button"); menu.className="menu"; menu.type="button";
    menu.setAttribute("aria-label","Open navigation"); menu.setAttribute("aria-expanded","false"); menu.textContent="☰";
    const nav=document.createElement("nav"); nav.className="nav-links"; nav.setAttribute("aria-label","Primary navigation");
    navItems.forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;if(current===href)a.setAttribute("aria-current","page");nav.appendChild(a)});
    menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close navigation":"Open navigation")});
    wrap.append(brand,menu,nav); header.append(wrap); navHost.replaceChildren(header);
  }

  const footerHost=document.getElementById("site-footer");
  if(footerHost){
    const footer=document.createElement("footer"); footer.className="site-footer";
    const wrap=document.createElement("div"); wrap.className="shell";
    const grid=document.createElement("div"); grid.className="footer-grid";
    const identity=document.createElement("div");
    const brand=document.createElement("a"); brand.className="brand"; brand.href="/"; brand.textContent="Adarsh.";
    const note=document.createElement("p"); note.textContent="Current developer platform — projects, labs, tools and notes.";
    identity.append(brand,note);
    const links=document.createElement("div"); links.className="footer-links";
    navItems.slice(1).forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;links.appendChild(a)});
    grid.append(identity,links);
    const bottom=document.createElement("div"); bottom.className="footer-bottom";
    const year=document.createElement("span"); year.textContent="© "+new Date().getFullYear()+" Adarsh Kumar";
    const archive=document.createElement("a"); archive.href="/projects/previous-portfolio"; archive.textContent="Previous portfolio →";
    bottom.append(year,archive); wrap.append(grid,bottom); footer.append(wrap); footerHost.replaceChildren(footer);
  }

  document.querySelectorAll('a[target="_blank"]').forEach(a=>a.rel="noopener noreferrer");

  /* ---------------------------------------------------------
     MONOGRAM WATER FIELD
     A traced from the supplied reference. SVG displacement is
     driven by pointer velocity; ripple rings persist briefly.
     --------------------------------------------------------- */
  const stage=document.getElementById("hero-a-stage");
  const svg=document.getElementById("hero-a-svg");
  const displacement=document.getElementById("a-displace");
  const noise=document.getElementById("a-noise");
  const rippleGroup=document.getElementById("a-ripples");

  if(stage&&svg&&!reduce&&!coarse){
    let lastX=0,lastY=0,lastT=performance.now(),energy=0,raf=0;
    const ripples=[];
    const addRipple=(x,y,power=1)=>{
      const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
      c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r","3");
      c.setAttribute("stroke","rgba(255,245,215,.68)");c.setAttribute("stroke-width","1.1");
      c.setAttribute("opacity",".72"); rippleGroup.appendChild(c);
      ripples.push({el:c,x,y,r:3,life:1,power});
      if(ripples.length>18){ripples.shift().el.remove()}
    };
    const pointer=e=>{
      const r=stage.getBoundingClientRect();
      const x=Math.max(0,Math.min(270,(e.clientX-r.left)/r.width*270));
      const y=Math.max(0,Math.min(320,(e.clientY-r.top)/r.height*320));
      const now=performance.now(),dt=Math.max(8,now-lastT),vx=x-lastX,vy=y-lastY;
      const speed=Math.min(1.8,Math.hypot(vx,vy)/(dt*.8));
      lastX=x;lastY=y;lastT=now;
      energy=Math.min(2.8,energy+speed*.75);
      stage.style.setProperty("--a-x",(x/270*100)+"%");
      stage.style.setProperty("--a-y",(y/320*100)+"%");
      if(speed>.12)addRipple(x,y,Math.min(1.5,.45+speed));
    };
    stage.addEventListener("pointermove",pointer,{passive:true});
    stage.addEventListener("pointerenter",e=>{
      const r=stage.getBoundingClientRect();
      addRipple((e.clientX-r.left)/r.width*270,(e.clientY-r.top)/r.height*320,1.2);
    });
    const tick=()=>{
      energy*=.965;
      if(displacement)displacement.setAttribute("scale",(energy*8).toFixed(2));
      if(noise)noise.setAttribute("baseFrequency",(.008+energy*.0015).toFixed(4)+" "+(.028+energy*.004).toFixed(4));
      for(let i=ripples.length-1;i>=0;i--){
        const q=ripples[i]; q.r+=.7+q.power*.34; q.life-=.018;
        q.el.setAttribute("r",q.r.toFixed(2)); q.el.setAttribute("opacity",Math.max(0,q.life*.45).toFixed(3));
        q.el.setAttribute("stroke-width",(1+q.life*2*q.power).toFixed(2));
        if(q.life<=0){q.el.remove();ripples.splice(i,1)}
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    window.addEventListener("pagehide",()=>cancelAnimationFrame(raf),{once:true});
  }

  /* ---------------------------------------------------------
     Project object interaction — tiny tilt + local light.
     --------------------------------------------------------- */
  if(!reduce&&!coarse){
    document.querySelectorAll(".tilt-card").forEach(card=>{
      card.addEventListener("pointermove",e=>{
        const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
        const rx=(.5-py)*3,ry=(px-.5)*3;
        card.style.setProperty("--mx",(px*100).toFixed(1)+"%");
        card.style.setProperty("--my",(py*100).toFixed(1)+"%");
        card.style.transform="perspective(1100px) rotateX("+rx.toFixed(2)+"deg) rotateY("+ry.toFixed(2)+"deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave",()=>{card.style.transform=""});
    });
  }

  /* ---------------------------------------------------------
     Entrance reveal — native IntersectionObserver only.
     --------------------------------------------------------- */
  if(!reduce&&"IntersectionObserver"in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add("is-visible");io.unobserve(entry.target)}
      });
    },{threshold:.12});
    document.querySelectorAll(".js-reveal").forEach(el=>io.observe(el));
  }else{
    document.querySelectorAll(".js-reveal").forEach(el=>el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     Refined cursor for desktop pointer devices.
     --------------------------------------------------------- */
  if(!reduce&&!coarse){
    const cursor=document.createElement("div");cursor.className="custom-cursor";document.body.appendChild(cursor);
    let tx=-100,ty=-100,x=-100,y=-100;
    const tick=()=>{x+=(tx-x)*.16;y+=(ty-y)*.16;cursor.style.transform="translate3d("+x+"px,"+y+"px,0) translate(-50%,-50%)";requestAnimationFrame(tick)};
    document.addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY},{passive:true});
    requestAnimationFrame(tick);
    document.querySelectorAll("a,.button,.tilt-card,.project-media").forEach(el=>{
      el.addEventListener("pointerenter",()=>cursor.classList.add("is-link"));
      el.addEventListener("pointerleave",()=>cursor.classList.remove("is-link"));
    });
  }
})();