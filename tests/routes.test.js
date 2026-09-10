const assert = require("assert");
const fs = require("fs");
const path = require("path");
const http = require("http");
const {spawn, execFileSync} = require("child_process");

const routes = [
  "/", "/projects", "/projects/anshika-studio", "/projects/todo-app", "/projects/previous-portfolio",
  "/labs", "/labs/liquid-interaction", "/labs/magnetic-ui", "/labs/scroll-playground",
  "/tools", "/tools/json", "/tools/image-optimizer", "/tools/gradient-generator", "/stack",
  "/blog", "/about", "/contact", "/stats", "/todo", "/archive/previous-portfolio/"
];

const root = path.join(__dirname, "..");
const requiredFiles = [
  "public/index.html", "public/projects/index.html", "public/projects/todo-app.html",
  "public/projects/previous-portfolio.html", "public/todo-app/index.html", "public/archive/previous-portfolio/index.html",
  "public/labs/index.html", "public/labs/liquid-interaction/index.html", "public/labs/magnetic-ui/index.html",
  "public/labs/scroll-playground/index.html", "public/tools/index.html", "public/tools/json/index.html",
  "public/tools/image-optimizer/index.html", "public/tools/gradient-generator/index.html", "public/stack/index.html",
  "server.js", "vercel.json", "SECURITY.md", ".github/workflows/test.yml"
];
requiredFiles.forEach(file => assert.ok(fs.existsSync(path.join(root, file)), file + " should exist"));
assert.ok(!fs.existsSync(path.join(root, "public/projects/character-gallery.html")));
assert.ok(!fs.existsSync(path.join(root, "public/Doraemon.png")));

const jsFiles = [
  "public/js/site.js", "public/js/todo.js", "public/js/contact.js", "public/js/tools.js",
  "public/js/lab-liquid.js", "public/js/lab-magnetic.js", "public/js/lab-scroll.js",
  "public/js/tool-json.js", "public/js/tool-image.js", "public/js/tool-gradient.js"
];
jsFiles.forEach(file => execFileSync(process.execPath, ["--check", path.join(root, file)], {stdio: "pipe"}));

const currentSurfaceText = [];
function collectCurrentSurface(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === path.join(root, "public/archive") || full === path.join(root, "tests")) continue;
      collectCurrentSurface(full);
    } else if (/\.(html|css|js|json|md|xml|txt|yml|yaml)$/.test(entry.name)) {
      currentSurfaceText.push([full, fs.readFileSync(full, "utf8")]);
    }
  }
}
collectCurrentSurface(root);
for (const [file, text] of currentSurfaceText) {
  assert.doesNotMatch(text, /Character Gallery|character-gallery|Task Tracker|Experiment slot|premium-portfolio/,
    "obsolete current-surface reference in " + path.relative(root, file));
}

const labs = fs.readFileSync(path.join(root, "public/labs/index.html"), "utf8");
assert.match(labs, /Liquid Interaction/);
assert.match(labs, /Magnetic UI/);
assert.match(labs, /Scroll Interaction Playground/);
assert.doesNotMatch(labs, /Task Tracker|Character Gallery|Experiment slot/);

const tools = fs.readFileSync(path.join(root, "public/tools/index.html"), "utf8");
assert.match(tools, /JSON Formatter/);
assert.match(tools, /Image Optimizer/);
assert.match(tools, /Gradient Generator/);

const projects = fs.readFileSync(path.join(root, "public/projects/index.html"), "utf8");
assert.match(projects, /Anshika Studio/);
assert.match(projects, /Todo App/);
assert.match(projects, /SIH 2026/);
assert.match(projects, /Previous portfolio preview/);
assert.doesNotMatch(projects, /Character Gallery|character-gallery/);

const todo = fs.readFileSync(path.join(root, "public/todo-app/index.html"), "utf8");
const todoJs = fs.readFileSync(path.join(root, "public/js/todo.js"), "utf8");
assert.match(todo, /searchInput/);
assert.match(todo, /data-filter="active"/);
assert.match(todo, /data-filter="completed"/);
assert.match(todo, /sortSelect/);
assert.match(todoJs, /localStorage/);
assert.match(todoJs, /editTask/);
assert.match(todoJs, /completed = !task\.completed/);
assert.match(todoJs, /tasks = tasks\.filter\(entry => entry\.id !== task\.id\)/);

const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const rewriteSources = new Set(vercel.rewrites.map(item => item.source));
for (const route of routes) assert.ok(rewriteSources.has(route), "missing Vercel rewrite: " + route);
assert.ok(!rewriteSources.has("/projects/character-gallery"));

const child = spawn(process.execPath, ["server.js"], {env: {...process.env, PORT: "3219"}});
const get = route => new Promise((resolve, reject) => {
  const req = http.get("http://127.0.0.1:3219" + route, res => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => resolve({status: res.statusCode, body, headers: res.headers}));
  });
  req.on("error", reject);
});

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 250));
    for (const route of routes) {
      const res = await get(route);
      assert.strictEqual(res.status, 200, route + " should return 200");
      assert.match(res.headers["content-type"], /text\/html/);
      assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
      assert.match(res.headers["content-security-policy"], /default-src 'self'/);
    }

    assert.strictEqual((await get("/projects/character-gallery")).status, 404);
    const missing = await get("/does-not-exist");
    assert.strictEqual(missing.status, 404);
    assert.doesNotMatch(missing.body, /Error:|at .*server\.js|\/.*server\.js/);
    assert.strictEqual((await get("/../../package.json")).status, 404);
    assert.strictEqual((await get("/%E0%A4%A")).status, 404);

    const method = await new Promise((resolve, reject) => {
      const req = http.request("http://127.0.0.1:3219/", {method: "POST"}, res => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      });
      req.on("error", reject);
      req.end();
    });
    assert.strictEqual(method, 405);
    console.log("Route, security-header, stale-reference, Vercel-rewrite, 404, traversal, malformed-request, method and syntax tests passed.");
  } finally {
    child.kill();
  }
})().catch(error => {
  child.kill();
  console.error(error);
  process.exit(1);
});
