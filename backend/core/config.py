import os
import sys
from dotenv import load_dotenv

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CORE_DIR)
BASE_DIR = BACKEND_DIR
ROOT_DIR = os.path.dirname(BACKEND_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
DB_DIR = os.path.join(BACKEND_DIR, "db")
MODELS_DIR = os.path.join(BACKEND_DIR, "models")

for p in [BACKEND_DIR, ROOT_DIR, CORE_DIR, DB_DIR, os.path.join(BACKEND_DIR, "services")]:
    if p not in sys.path:
        sys.path.insert(0, p)

root_env = os.path.join(ROOT_DIR, ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

def resolve_path(env_val, default_rel):
    if env_val:
        if os.path.isabs(env_val):
            return env_val
        for candidate in [
            os.path.join(ROOT_DIR, env_val),
            os.path.join(BACKEND_DIR, env_val),
            os.path.join(DATA_DIR, os.path.basename(env_val)),
            os.path.join(DB_DIR, os.path.basename(env_val)),
            os.path.join(MODELS_DIR, os.path.basename(env_val))
        ]:
            if os.path.exists(candidate):
                return candidate

    for fallback in [
        os.path.join(BACKEND_DIR, default_rel),
        os.path.join(DATA_DIR, os.path.basename(default_rel)),
        os.path.join(DB_DIR, os.path.basename(default_rel)),
        os.path.join(MODELS_DIR, os.path.basename(default_rel))
    ]:
        if os.path.exists(fallback):
            return fallback

    return os.path.join(BACKEND_DIR, default_rel)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_PATH = resolve_path(os.getenv("DATABASE_PATH"), os.path.join("db", "co2_forecast.db"))
MODEL_DIR = resolve_path(os.getenv("MODEL_DIR"), "models")
CSV_PATH = resolve_path(os.getenv("CSV_PATH"), os.path.join("data", "preprocessed_co2_dataset.csv"))
SAMPLE_CSV_PATH = os.path.join(DATA_DIR, "sample_test_data.csv")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "0.0.0.0")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
