import os

import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://user:password@localhost:5432/mydatabase?sslmode=disable",
)

_db: psycopg2.extensions.connection | None = None


def get_db() -> psycopg2.extensions.connection:
    """Return a live database connection, creating and initialising it if needed."""
    global _db
    if _db is None or _db.closed:
        _db = psycopg2.connect(DATABASE_URL)
        _db.autocommit = True
        with _db.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS kv_store (
                    key   TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
    return _db
