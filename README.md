# Powernet Engineering Website

Official web platform for Powernet (Pvt) Ltd — Sri Lanka's trusted one-stop infrastructure engineering partner.

## Tech Stack

- **Framework**: [Astro 7](https://astro.build/)
- **Styling**: Vanilla CSS (CSS Variables, Grid, Flexbox)
- **Typography**: Inter & Roboto Mono
- **Deployment**: Vercel

## Architecture

```text
src/
├── assets/          # Static logos, icons, and photography
├── components/
│   └── global/      # Header.astro, Footer.astro
├── content/         # Structured content collections (services, projects)
├── layouts/         # BaseLayout.astro
├── pages/           # index.astro, about.astro, contact.astro
└── styles/          # Global tokens, reset, typography, and animations
```

## Production Build

```sh
npm install
npm run build
```
