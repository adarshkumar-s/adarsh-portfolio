(() => {
const navItems=[["/","Home"],["/projects","Projects"],["/labs","Labs"],["/tools","Tools"],["/blog","Blog"],["/about","About"],["/stats","Stats"],["/contact","Contact"]];
const path=location.pathname.replace(/\/$/,"")||"/";
document.getElementById("site-nav").innerHTML='<header class="site-header"><div class="shell nav"><a class="brand" href="/">Adarsh<span>.<i></i></span></a><button class="menu" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="nav-links" aria-label="Primary navigation">'+navItems.map(([href,label])=>'<a href="'+href+'" '+(path===href?'aria-current="page"':'')+'>'+label+'</a>').join("")+'</nav></div></header>';
const menu=document.querySelector(".menu"), links=document.querySelector(".nav-links"); menu?.addEventListener("click",()=>{const open=links.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});
const year=new Date().getFullYear();
document.getElementById("site-footer").innerHTML='<footer class="site-footer"><div class="shell"><div class="footer-grid"><div><a class="brand" href="/">Adarsh<span>.<i></i></span></a><p>A developer platform for projects, experiments and useful tools.</p></div><div class="footer-links">'+navItems.slice(1).map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join("")+'</div></div><div class="footer-bottom"><span>© '+year+' Adarsh Kumar</span><span>Built with HTML, CSS & JavaScript</span></div></div></footer>';
document.querySelectorAll('a[target="_blank"]').forEach(a=>{if(!a.rel.includes("noopener"))a.rel="noopener noreferrer"});
})();