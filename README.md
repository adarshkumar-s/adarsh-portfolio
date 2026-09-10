# Adarsh Kumar

A static, multi-page personal portfolio built with HTML, CSS, JavaScript, and a small Node.js server for local development.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js built-in `http`, `fs`, and `path` modules

## Install and run

```bash
npm ci
npm test
npm start
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` only when local server configuration is needed. The current server only uses `PORT`; keep real secrets out of the repository and frontend files.

## Project structure

- `public/` — site pages, styles, scripts, images, and archived portfolio assets
- `public/projects/` — project pages
- `public/archive/previous-portfolio/` — preserved earlier portfolio
- `public/todo-app/` — Todo application
- `public/labs/` — interactive experiments
- `public/tools/` — browser-local utilities
- `public/stack/` — Tech Stack & Infrastructure
- `public/js/` — shared and page-specific browser scripts
- `tests/` — route/server tests
- `server.js` — local static HTTP server
- `vercel.json` — static Vercel routing and security headers

## Routes

- `/`
- `/projects`
- `/projects/anshika-studio`
- `/projects/todo-app`
- `/projects/previous-portfolio`
- `/projects/sih-2026`
- `/labs`
- `/labs/liquid-interaction`
- `/labs/magnetic-ui`
- `/labs/scroll-playground`
- `/tools`
- `/tools/json`
- `/tools/image-optimizer`
- `/tools/gradient-generator`
- `/stack`
- `/blog`
- `/about`
- `/contact`
- `/stats`
- `/todo`
- `/archive/previous-portfolio/`

## Testing

`npm test` starts the local server on an isolated test port and checks required routes, security headers, current-surface stale references, 404 behavior, traversal rejection, malformed requests, unsupported HTTP methods, Vercel rewrites, and JavaScript syntax.

## Deployment

The site is configured as a static Vercel deployment. `vercel.json` maps clean routes to the corresponding HTML files and supplies security headers. The Node server is for local development and automated route checks.

## Security and development notes

- `.env` files are ignored and `.env.example` contains placeholders only.
- The static server confines resolved paths to `public/` and rejects traversal attempts.
- Production responses avoid exposing stack traces or filesystem paths.
- Security headers include CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- External links opened in new tabs use `noopener noreferrer`.
- Keep dependencies minimal and review `npm audit` results before dependency changes.
