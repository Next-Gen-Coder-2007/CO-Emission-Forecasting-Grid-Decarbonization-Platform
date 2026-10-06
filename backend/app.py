import os
from flask import Flask
from flask_cors import CORS
from config import CORS_ORIGINS, PORT, HOST, FLASK_DEBUG
from db import ensure_db_initialized
from models_cache import load_trained_models
from blueprints import (
    general_bp,
    models_bp,
    dataset_bp,
    inference_bp,
    simulations_bp
)

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}}, supports_credentials=True)

    ensure_db_initialized()
    load_trained_models()

    app.register_blueprint(general_bp)
    app.register_blueprint(models_bp)
    app.register_blueprint(dataset_bp)
    app.register_blueprint(inference_bp)
    app.register_blueprint(simulations_bp)

    return app

app = create_app()

if __name__ == '__main__':
    print(f"Launching Flask Pure REST API on http://{HOST}:{PORT}...")
    app.run(host=HOST, port=PORT, debug=FLASK_DEBUG)
