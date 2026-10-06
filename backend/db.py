import os
import sqlite3
from config import DB_PATH, DATABASE_URL

def get_db_connection():
    """
    Returns a database connection.
    Supports SQLite database path and cloud connection strings (DATABASE_URL).
    """
    if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
        try:
            from sqlalchemy import create_engine
            engine = create_engine(DATABASE_URL)
            return engine.connect()
        except Exception as e:
            print(f"Warning: Cloud DATABASE_URL connection failed ({e}), falling back to SQLite: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_db_initialized():
    """Checks if SQLite DB exists, initializes if missing"""
    if not os.path.exists(DB_PATH):
        try:
            from init_db import init_database
            init_database()
        except Exception as e:
            print(f"Database auto-initialization error: {e}")
