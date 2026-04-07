# Archivist

A modern records management system for tracking physical archives, boxes, and folders with automated retention period calculations and lifecycle management.

## Architecture

- **Backend** (`archivist-backend/`): FastAPI + SQLAlchemy + SQLite
- **Frontend** (`archivist-frontend/`): React + Vite + Tailwind CSS + shadcn/ui

## Features

- **Dashboard**: Overview of archive system with key metrics
- **Folders**: Create and manage record folders with auto-generated retention IDs and expiry calculation
- **Boxes**: Physical container management with auto-generated codes
- **Retention Codes**: Define retention categories and period rules (years, months, fixed date, permanent)
- **Locations**: Track on-site and off-site storage locations
- **Archives**: Manage long-term archive destinations
- **Import**: Bulk CSV import for boxes and folders
- **Settings**: View system configuration and database info

## Getting Started

### Backend

```bash
cd archivist-backend
poetry install
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd archivist-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Configuration

Create a `.env` file in `archivist-frontend/`:

```
VITE_API_URL=http://localhost:8000
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | FastAPI |
| ORM | SQLAlchemy |
| Database | SQLite (WAL mode) |
| Validation | Pydantic |
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Charts | Recharts |
