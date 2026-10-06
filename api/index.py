import os
import sys

# Ensure project root and backend directory are in sys.path for Vercel Serverless Function
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for path in [BACKEND_DIR, ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

from app import app

# Vercel Serverless Function entry point
handler = app
