const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;

const ROUTES = new Map([
  ["/", "index.html"], ["/projects", "projects/index.html"], ["/labs", "labs/index.html"],
  ["/tools", "tools/index.html"], ["/blog", "blog/index.html"], ["/about", "about/index.html"],
  ["/contact", "contact/index.html"], ["/stats", "stats/index.html"], ["/todo", "todo-app/index.html"],
  ["/projects/anshika-studio", "projects/anshika-studio.html"],
  ["/projects/todo-app", "projects/todo-app.html"],
  ["/projects/previous-portfolio", "projects/previous-portfolio.html"],
  ["/projects/character-gallery", "projects/character-gallery.html"]
]);

const MIME_TYPES = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8"};
const SECURITY_HEADERS = {"X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"};

function safePath(requestPath) {
  try {
    const decoded = decodeURIComponent(requestPath);
    if (decoded.includes("\0") || decoded.includes("..")) return null;
    const relative = ROUTES.get(decoded) || decoded.replace(/^\/+/, "");
    const resolved = path.resolve(PUBLIC_DIR, relative);
    return resolved === PUBLIC_DIR || resolved.startsWith(PUBLIC_DIR + path.sep) ? resolved : null;
  } catch { return null; }
}
function send404(req,res) {
  const file=path.join(PUBLIC_DIR,"404.html");
  res.writeHead(404,{...SECURITY_HEADERS,"Content-Type":MIME_TYPES[".html"]});
  if(req.method==="HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}
function serveFile(req,res,filePath) {
  fs.stat(filePath,(error,stat)=>{
    if(error || !stat.isFile()) return send404(req,res);
    const ext=path.extname(filePath).toLowerCase();
    res.writeHead(200,{...SECURITY_HEADERS,"Content-Type":MIME_TYPES[ext]||"application/octet-stream","Cache-Control":ext===".html"?"no-store":"public, max-age=86400"});
    if(req.method==="HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}
function handler(req,res) {
  if(req.method!=="GET" && req.method!=="HEAD"){res.writeHead(405,{...SECURITY_HEADERS,Allow:"GET, HEAD","Content-Type":"text/plain; charset=utf-8"});return res.end("Method Not Allowed")}
  const pathname=new URL(req.url,"http://localhost").pathname.replace(/\/$/,"")||"/";
  const filePath=safePath(pathname);
  if(!filePath) return send404(req,res);
  serveFile(req,res,filePath);
}
http.createServer(handler).listen(PORT,()=>console.log("Adarsh developer platform running on port "+PORT));
