# Adarsh — Current Developer Platform

This branch contains the current personal developer platform. The previous portfolio is intentionally preserved as an archived project rather than deleted.

## Run locally

`npm install`
`npm test`
`npm start`

Open `http://localhost:3000`.

## Current routes

- /
- /projects
- /projects/anshika-studio
- /projects/todo-app
- /projects/previous-portfolio
- /projects/character-gallery
- /labs
- /tools
- /blog
- /about
- /contact
- /stats
- /todo
- /archive/previous-portfolio/

## Projects

Only four projects are presented:

1. Anshika Studio — verified from the connected GitHub repository.
2. Todo App — preserved as a working browser application and case study.
3. Previous Portfolio — the original portfolio is preserved under `public/archive/previous-portfolio/`.
4. Character Gallery — the earlier visual experiment using existing assets.

No fabricated projects, statistics, employment, education, clients, testimonials or achievements are included.

## Vercel

The site is a static multi-page deployment. `vercel.json` explicitly maps clean URLs to HTML files and supplies security headers. `server.js` remains the local Node server; it is not required to render the static Vercel site.

## Security

- No secrets are stored in frontend code.
- `.env` files are ignored; `.env.example` contains placeholders only.
- Local routing rejects traversal attempts.
- Security headers include CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy and Permissions-Policy.
- Browser Todo state remains localStorage data.
- Browser tools do not upload their inputs.
- Contact validation does not claim email delivery without a configured provider.

## Content policy

Unknown personal information remains unknown. Real project facts are sourced from repository evidence. Live demo URLs, email delivery and verified GitHub activity are not claimed unless configured or verified.
