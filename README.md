# El Handasya CRM

A CRM system for a paint company. Built as a monorepo with a plain HTML/CSS/ES-module frontend and a Node.js + Express + Prisma backend.

## Project structure

```
elhandasya-crm/
├── client/   — frontend (Vite dev server, no framework)
└── server/   — backend (Express, Prisma, JWT auth)
```

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL (for when the database layer is wired up)

### Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### Run the backend (port 4000)

```bash
cd server
cp .env.example .env   # then edit DATABASE_URL / JWT_SECRET
npm run dev
# → Server running on port 4000
# → GET http://localhost:4000/api/health  →  { "status": "ok" }
```

### Run the frontend (port 5173)

```bash
cd client
npm run dev
# → http://localhost:5173
```

> Full run instructions will be updated as the implementation progresses.
