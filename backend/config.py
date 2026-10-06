import os
import sys
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

root_env = os.path.join(ROOT_DIR, ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

def resolve_path(env_val, default_name):
    if env_val:
        if os.path.isabs(env_val):
            return env_val
        p1 = os.path.join(ROOT_DIR, env_val)
        if os.path.exists(p1):
            return p1
        p2 = os.path.join(BASE_DIR, env_val)
        if os.path.exists(p2):
            return p2
        p3 = os.path.join(BASE_DIR, os.path.basename(env_val))
        if os.path.exists(p3):
            return p3
    return os.path.join(BASE_DIR, default_name)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_PATH = resolve_path(os.getenv("DATABASE_PATH"), "co2_forecast.db")

MODEL_DIR = resolve_path(os.getenv("MODEL_DIR"), "models")
CSV_PATH = resolve_path(os.getenv("CSV_PATH"), "preprocessed_co2_dataset.csv")
SAMPLE_CSV_PATH = os.path.join(BASE_DIR, "sample_test_data.csv")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "0.0.0.0")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

os.makedirs(MODEL_DIR, exist_ok=True)
