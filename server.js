const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;

const ROUTES = new Map([
  ["/", "index.html"], ["/projects", "projects/index.html"], ["/labs", "labs/index.html"],
  ["/tools", "tools/index.html"], ["/stack", "stack/index.html"], ["/blog", "blog/index.html"],
  ["/about", "about/index.html"], ["/contact", "contact/index.html"], ["/stats", "stats/index.html"],
  ["/projects/anshika-studio", "projects/anshika-studio.html"],
  ["/projects/previous-portfolio", "projects/previous-portfolio.html"],
  ["/projects/sih-2026", "projects/sih-2026.html"],
  ["/labs/liquid-interaction", "labs/liquid-interaction/index.html"],
  ["/labs/magnetic-ui", "labs/magnetic-ui/index.html"],
  ["/labs/scroll-playground", "labs/scroll-playground/index.html"],
  ["/tools/json", "tools/json/index.html"],
  ["/tools/image-optimizer", "tools/image-optimizer/index.html"],
  ["/tools/gradient-generator", "tools/gradient-generator/index.html"],
  ["/tools/file-converter", "tools/file-converter/index.html"],
  ["/todo", "todo-app/index.html"],
  ["/archive/previous-portfolio", "archive/previous-portfolio/index.html"]
]);

const MIME_TYPES = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".avif":"image/avif",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8"};
const SECURITY_HEADERS = {"X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self' https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"};

function safePath(requestPath) {
  try {
    const decoded = decodeURIComponent(requestPath);
    if (decoded.includes("\0") || decoded.includes("..")) return null;
    const relative = ROUTES.get(decoded) || decoded.replace(/^\/+/, "");
    const resolved = path.resolve(PUBLIC_DIR, relative);
    return resolved === PUBLIC_DIR || resolved.startsWith(PUBLIC_DIR + path.sep) ? resolved : null;
  } catch {
    return null;
  }
}

function send404(req, res) {
  const file = path.join(PUBLIC_DIR, "404.html");
  res.writeHead(404, {...SECURITY_HEADERS, "Content-Type": MIME_TYPES[".html"]});
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).on("error", () => res.end()).pipe(res);
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return send404(req, res);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=86400"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).on("error", () => {
      if (!res.headersSent) res.writeHead(500, SECURITY_HEADERS);
      res.end();
    }).pipe(res);
  });
}

function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, {...SECURITY_HEADERS, Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8"});
    return res.end("Method Not Allowed");
  }

  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname.replace(/\/$/, "") || "/";
  } catch {
    return send404(req, res);
  }

  const filePath = safePath(pathname);
  if (!filePath) return send404(req, res);
  serveFile(req, res, filePath);
}

const server = http.createServer((req, res) => {
  try {
    handler(req, res);
  } catch {
    if (!res.headersSent) {
      res.writeHead(500, {...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8"});
    }
    res.end("Internal Server Error");
  }
});

server.on("clientError", (_error, socket) => socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"));

server.listen(PORT, () => console.log("Adarsh portfolio running on port " + PORT));