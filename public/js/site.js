(() => {
  const navItems = [["/","Home"],["/projects","Projects"],["/labs","Labs"],["/tools","Tools"],["/blog","Blog"],["/about","About"],["/stats","Stats"],["/contact","Contact"]];
  const current = location.pathname.replace(/\/$/,"") || "/";
  const navHost = document.getElementById("site-nav");
  const footerHost = document.getElementById("site-footer");
  if (navHost) {
    const header=document.createElement("header"); header.className="site-header";
    const wrap=document.createElement("div"); wrap.className="shell nav";
    const brand=document.createElement("a"); brand.className="brand"; brand.href="/"; brand.textContent="Adarsh.";
    const menu=document.createElement("button"); menu.className="menu"; menu.type="button"; menu.setAttribute("aria-label","Open navigation"); menu.setAttribute("aria-expanded","false"); menu.textContent="☰";
    const nav=document.createElement("nav"); nav.className="nav-links"; nav.setAttribute("aria-label","Primary navigation");
    navItems.forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;if(current===href)a.setAttribute("aria-current","page");nav.appendChild(a)});
    menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close navigation":"Open navigation")});
    wrap.append(brand,menu,nav); header.append(wrap); navHost.replaceChildren(header);
  }
  if (footerHost) {
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
})();