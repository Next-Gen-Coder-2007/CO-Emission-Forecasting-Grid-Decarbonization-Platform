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
    """Application factory for the Flask REST API"""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}}, supports_credentials=True)

    # Ensure database schema is ready
    ensure_db_initialized()

    # Preload machine learning models into memory cache
    load_trained_models()

    # Register modular blueprints
    app.register_blueprint(general_bp)
    app.register_blueprint(models_bp)
    app.register_blueprint(dataset_bp)
    app.register_blueprint(inference_bp)
    app.register_blueprint(simulations_bp)

    return app

# WSGI application instance for Vercel and production WSGI servers
app = create_app()

if __name__ == '__main__':
    print(f"Launching Flask Pure REST API on http://{HOST}:{PORT}...")
    app.run(host=HOST, port=PORT, debug=FLASK_DEBUG)
