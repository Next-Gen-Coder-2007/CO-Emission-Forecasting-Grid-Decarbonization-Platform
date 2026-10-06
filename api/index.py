import os
import sys

# Ensure project root and backend directory are in sys.path for Vercel Serverless Function
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for path in [ROOT_DIR, BACKEND_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app import app
except ImportError:
    try:
        from app import app
    except ImportError:
        from backend import app

# Vercel Serverless Function WSGI entry point
handler = app
