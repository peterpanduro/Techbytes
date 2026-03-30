# Docker-compose Foundations

## Overview
A local key-value store API backed by PostgreSQL, demonstrating how to use Docker Compose to run a multi-container application with a custom image and a database.

**Stack:**
- **API:** Python (`http.server`) — no web framework
- **Database:** PostgreSQL
- **Orchestration:** Docker Compose

## Prerequisites
- Docker installed
    - Windows/Mac: https://www.docker.com/products/docker-desktop/
    - Linux: https://docs.docker.com/engine/install
- Python 3.8+ (only needed for local development)
    - https://www.python.org/downloads/

## Running with Docker Compose

1. Copy the example env file and fill in your values:
    ```bash
    cp .env.example .env
    ```

2. Start the services:
    ```bash
    docker compose up -d
    ```

The API will be available at `http://localhost:8080`.

## Running Locally

You'll need a PostgreSQL instance running and accessible. The quickest way is to start just the database with Docker Compose:

```bash
docker compose up -d db
```

Then in a separate terminal, run the API:

```bash
./run.sh
```

`run.sh` will:
1. Load variables from `.env`
2. Create a Python virtual environment in `.venv` (if one doesn't exist)
3. Install dependencies
4. Start the API on `http://localhost:8080`

> Make sure `DATABASE_URL` in your `.env` points to `localhost` when running outside Docker (this is the default in `.env.example`).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/keyvalue` | Store a key-value pair |
| `GET` | `/keyvalues` | Retrieve all key-value pairs |
| `GET` | `/keyvalue/:key` | Retrieve a single value by key |
| `DELETE` | `/keyvalue/:key` | Delete a key-value pair |

### Examples

```bash
# Health check
curl http://localhost:8080/

# Store a value
curl -X POST http://localhost:8080/keyvalue \
  -H "Content-Type: application/json" \
  -d '{"key": "hello", "value": "world"}'

# Get a value
curl http://localhost:8080/keyvalue/hello

# Get all values
curl http://localhost:8080/keyvalues

# Delete a value
curl -X DELETE http://localhost:8080/keyvalue/hello
```

## Configuration

Environment variables are loaded from `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |

## FAQ

**Why does the API container fail to start?**
The `api` service depends on `db` being ready. If the database is still initialising, restart the API container:
```bash
docker compose restart api
```

