# Adarsh Kumar

A static, multi-page personal portfolio built with HTML, CSS, JavaScript, and a small Node.js server for local development.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js built-in \`http\`, \`fs\`, and \`path\` modules

## Install and run

\`\`\`bash
npm ci
npm test
npm start
\`\`\`

Open \`http://localhost:3000\`.

## Environment

Copy \`.env.example\` to \`.env\` only when local server configuration is needed. The current server only uses \`PORT\`; keep real secrets out of the repository and frontend files.

## Project structure

- \`public/\` — site pages, styles, scripts, images, and archived portfolio assets
- \`public/projects/\` — project pages
- \`public/archive/previous-portfolio/\` — preserved earlier portfolio
- \`public/todo-app/\` — Todo application
- \`public/labs/\` — interactive experiments
- \`public/tools/\` — browser-local utilities
- \`public/tools/file-converter/\` — browser-first multi-format file converter
- \`public/stack/\` — Tech Stack & Infrastructure
- \`public/js/\` — shared and page-specific browser scripts
- \`tests/\` — route/server tests
- \`server.js\` — local static HTTP server
- \`vercel.json\` — static Vercel routing and security headers

## Routes

- \`/\`
- \`/projects\`
- \`/projects/anshika-studio\`
- \`/projects/previous-portfolio\`
- \`/projects/sih-2026\`
- \`/labs\`
- \`/labs/liquid-interaction\`
- \`/labs/magnetic-ui\`
- \`/labs/scroll-playground\`
- \`/tools\`
- \`/tools/file-converter\`
- \`/tools/json\`
- \`/tools/image-optimizer\`
- \`/tools/gradient-generator\`
- \`/stack\`
- \`/blog\`
- \`/about\`
- \`/contact\`
- \`/stats\`
- \`/archive/previous-portfolio/\`

## File Converter

The File Converter is a real browser-side utility at \`/tools/file-converter\`. It creates downloadable output files rather than simulating conversion.

Verified conversion matrix:

- PDF → DOCX, TXT, JPG, PNG
- JPG/PNG/WEBP/BMP/TIFF/GIF → JPG, PNG, WEBP, PDF where the browser can decode the source
- Multiple images → one PDF, with selectable order
- TXT → DOCX, PDF
- DOCX → TXT, HTML
- CSV → XLSX
- XLSX → CSV, one selected sheet at a time

Important limitations:

- 25 MB maximum per input file.
- PDF → DOCX is text-first reconstruction. It does not promise pixel-perfect layout or complete table/image preservation.
- Scanned PDFs with no selectable text are detected and are not advertised as OCR-perfect conversions.
- Animated GIFs are decoded as a frame when converted to raster formats; animation is not silently claimed to be preserved.
- XLSX sheets are never silently merged.
- DOCX/XLSX/PPTX/ODT/ODP → PDF is intentionally not advertised because the static deployment does not ship LibreOffice or another server-side office renderer.

### Privacy

The File Converter does not send user files to a conversion server, database, AI API, or paid third-party conversion service. Conversion runs in the browser. Pinned open-source libraries are lazy-loaded from jsDelivr only when a conversion needs them.

The tool does not create a public upload directory, does not accept filesystem paths, and does not store converted files after the page session.

### Dependencies and deployment

The portfolio remains a static deployment. No database, queue, paid API, or persistent backend is required for the File Converter.

The Vercel security policy allows the converter's pinned jsDelivr library origin. GitHub Pages serves the same static files; the converter page also carries its own CSP so the browser-side dependency boundary remains explicit.

## Testing

\`npm test\` starts the local server on an isolated test port and checks required routes, File Converter route presence, converter capability declarations, security headers, current-surface stale references, 404 behavior, traversal rejection, malformed requests, unsupported HTTP methods, Vercel rewrites, and JavaScript syntax.

## Deployment

The site is configured as a static Vercel deployment and also has a GitHub Pages workflow. \`vercel.json\` maps clean routes to the corresponding HTML files and supplies security headers. The Node server is for local development and automated route checks.

## Security and development notes

- \`.env\` files are ignored and \`.env.example\` contains placeholders only.
- The static server confines resolved paths to \`public/\` and rejects traversal attempts.
- Production responses avoid exposing stack traces or filesystem paths.
- Security headers include CSP, \`X-Content-Type-Options\`, \`X-Frame-Options\`, \`Referrer-Policy\`, and \`Permissions-Policy\`.
- External links opened in new tabs use \`noopener noreferrer\`.
- Keep dependencies minimal and review \`npm audit\` results before dependency changes.
- The File Converter validates source type and size, avoids user-controlled filesystem paths, and creates downloads from in-memory browser Blobs.
