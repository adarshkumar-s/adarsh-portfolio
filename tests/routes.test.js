const assert = require("assert");
const http = require("http");
const {spawn} = require("child_process");

const routes = [
  "/",
  "/projects",
  "/projects/anshika-studio",
  "/projects/todo-app",
  "/projects/previous-portfolio",
  "/projects/sih-2026",
  "/labs",
  "/tools",
  "/blog",
  "/about",
  "/contact",
  "/stats",
  "/todo",
  "/archive/previous-portfolio/"
];

const child = spawn(process.execPath, ["server.js"], {env: {...process.env, PORT: "3219"}});
const get = path => new Promise((resolve, reject) => {
  const req = http.get("http://127.0.0.1:3219" + path, res => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => resolve({status: res.statusCode, body, headers: res.headers}));
  });
  req.on("error", reject);
});

(async () => {
  await new Promise(resolve => setTimeout(resolve, 250));

  for (const route of routes) {
    const res = await get(route);
    assert.strictEqual(res.status, 200, route + " should return 200");
    assert.match(res.headers["content-type"], /text\/html/);
    assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
    assert.match(res.headers["content-security-policy"], /default-src 'self'/);
  }

  const missing = await get("/does-not-exist");
  assert.strictEqual(missing.status, 404);
  assert.doesNotMatch(missing.body, /Error:|at .*server\.js|\/.*server\.js/);

  const removed = await get("/projects/character-gallery");
  assert.strictEqual(removed.status, 404);

  const traversal = await get("/../../package.json");
  assert.strictEqual(traversal.status, 404);

  const malformed = await get("/%E0%A4%A");
  assert.strictEqual(malformed.status, 404);

  const method = await new Promise((resolve, reject) => {
    const req = http.request("http://127.0.0.1:3219/", {method: "POST"}, res => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject);
    req.end();
  });
  assert.strictEqual(method, 405);

  child.kill();
  console.log("Route, security-header, 404, traversal, malformed-request and method tests passed.");
})().catch(error => {
  child.kill();
  console.error(error);
  process.exit(1);
});
