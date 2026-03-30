import json
import re
from http.server import BaseHTTPRequestHandler

from db import get_db


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

    # ------------------------------------------------------------------ helpers

    def send_json(self, status: int, body: dict):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def read_json(self) -> dict | None:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return None
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            return None

    # ------------------------------------------------------------------ routing

    def do_GET(self):
        if self.path == "/":
            self._get_root()
        elif self.path == "/keyvalues":
            self._list_keyvalues()
        elif m := re.fullmatch(r"/keyvalue/(.+)", self.path):
            self._get_keyvalue(m.group(1))
        else:
            self.send_json(404, {"status": "Not found"})

    def do_POST(self):
        if self.path == "/keyvalue":
            self._upsert_keyvalue()
        else:
            self.send_json(404, {"status": "Not found"})

    def do_DELETE(self):
        if m := re.fullmatch(r"/keyvalue/(.+)", self.path):
            self._delete_keyvalue(m.group(1))
        else:
            self.send_json(404, {"status": "Not found"})

    # ------------------------------------------------------------------ handlers

    def _get_root(self):
        self.send_json(200, {"message": "API is running"})

    def _list_keyvalues(self):
        try:
            with get_db().cursor() as cur:
                cur.execute("SELECT key, value FROM kv_store")
                rows = [f"{r[0]}={r[1]}" for r in cur.fetchall()]
            self.send_json(200, {"data": rows})
        except Exception as e:
            self.send_json(500, {"status": "Internal server error", "error": str(e)})

    def _get_keyvalue(self, key: str):
        try:
            with get_db().cursor() as cur:
                cur.execute("SELECT value FROM kv_store WHERE key = %s", (key,))
                row = cur.fetchone()
            if row is None:
                self.send_json(404, {"status": "Not found"})
            else:
                self.send_json(200, {"key": key, "value": row[0]})
        except Exception as e:
            self.send_json(500, {"status": "Internal server error", "error": str(e)})

    def _upsert_keyvalue(self):
        body = self.read_json()
        if not body or "key" not in body or "value" not in body:
            self.send_json(400, {"status": "Bad request"})
            return
        try:
            with get_db().cursor() as cur:
                cur.execute("""
                    INSERT INTO kv_store (key, value) VALUES (%s, %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                """, (body["key"], body["value"]))
            self.send_json(200, {"status": "OK", "data": body})
        except Exception as e:
            self.send_json(500, {"status": "Internal server error", "error": str(e)})

    def _delete_keyvalue(self, key: str):
        try:
            with get_db().cursor() as cur:
                cur.execute("DELETE FROM kv_store WHERE key = %s", (key,))
                if cur.rowcount == 0:
                    self.send_json(404, {"status": "Not found"})
                    return
            self.send_json(200, {"status": "OK"})
        except Exception as e:
            self.send_json(500, {"status": "Internal server error", "error": str(e)})
