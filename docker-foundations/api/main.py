import os
from http.server import HTTPServer

from db import get_db
from handlers import Handler

PORT = int(os.getenv("PORT", 8080))

if __name__ == "__main__":
    get_db()
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Listening on :{PORT}")
    server.serve_forever()
