# Archivist Backend

FastAPI + SQLAlchemy backend for the Archivist records management platform.

## Prerequisites

- Python 3.11+
- Poetry
- ODBC Driver 18 for SQL Server

## Setup

```bash
poetry install
cp .env.example .env
```

## Run locally

```bash
poetry run uvicorn app.main:app --reload
```

- API root: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs

## Developer checks

```bash
poetry run python -m compileall app
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `DB_SERVER` | `localhost` | SQL Server host |
| `DB_NAME` | `Archivist` | Database name |
| `DB_USERNAME` | `sa` | SQL Server user |
| `DB_PASSWORD` | *(empty)* | SQL Server password |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver name |
| `DB_ENCRYPT` | `Optional` | SQL Server encryption mode |
| `DB_TRUST_CERT` | `Yes` | Trust SQL Server certificate |
| `JWT_SECRET_KEY` | `archivist-dev-secret-change-in-production` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Access token TTL (minutes) |
