# Archivist Frontend

React + Vite frontend for the Archivist records management platform.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env  # optional if you need to override API URL
```

If you do not create `.env`, the app defaults to `http://localhost:8000` in development.

## Scripts

```bash
npm run dev     # Start local dev server (http://localhost:5173)
npm run lint    # Run ESLint
npm run build   # Type-check and build production assets
npm run preview # Preview production build locally
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL for backend API |

## Related docs

- Root project guide: `../README.md`
- Backend setup: `../archivist-backend/README.md`
