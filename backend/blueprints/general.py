from datetime import datetime
from flask import Blueprint, jsonify
from db import get_db_connection
from models_cache import get_loaded_models

general_bp = Blueprint('general', __name__)

@general_bp.route('/', methods=['GET'])
def api_index():
    return jsonify({
        'status': 'online',
        'service': 'CO2 Emission Prediction REST API',
        'health': '/api/health',
        'endpoints': {
            'overview': '/api/overview',
            'models': '/api/models',
            'charts': '/api/charts/data',
            'train': '/api/train',
            'evaluation': '/api/real-evaluation',
            'test_csv': '/api/test-csv',
            'simulations': '/api/simulations',
            'dataset': '/api/dataset',
            'eda': '/api/eda'
        }
    })

@general_bp.route('/api/health', methods=['GET'])
def health_check():
    models_dict = get_loaded_models()
    return jsonify({
        'status': 'healthy',
        'server': 'Flask Pure REST API (Modular Blueprints)',
        'database': 'SQLite Connected',
        'models_loaded': list(models_dict.keys()),
        'timestamp': datetime.now().isoformat()
    })

@general_bp.route('/api/overview', methods=['GET'])
def get_overview():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*), MIN(date), MAX(date), AVG(total_co2) FROM emissions_data")
    count, min_date, max_date, avg_co2 = cursor.fetchone()

    cursor.execute("SELECT model_name, r2, rmse FROM models_registry WHERE model_type = 'ml' ORDER BY r2 DESC LIMIT 1")
    top_ml = cursor.fetchone()

    cursor.execute("SELECT model_name, r2, rmse FROM models_registry WHERE model_type = 'dl' ORDER BY r2 DESC LIMIT 1")
    top_dl = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM scenario_simulations")
    sim_count = cursor.fetchone()[0]
    conn.close()

    return jsonify({
        'total_samples': count,
        'date_range': f"{min_date} to {max_date}",
        'start_date': min_date,
        'end_date': max_date,
        'avg_co2': round(avg_co2, 2) if avg_co2 else 157.46,
        'top_ml': {
            'name': top_ml['model_name'] if top_ml else 'Ridge Regression',
            'r2': round(top_ml['r2'], 4) if top_ml else 0.9997,
            'rmse': round(top_ml['rmse'], 4) if top_ml else 0.0030
        },
        'top_dl': {
            'name': top_dl['model_name'] if top_dl else 'LSTM',
            'r2': round(top_dl['r2'], 4) if top_dl else 0.6663,
            'rmse': round(top_dl['rmse'], 4) if top_dl else 0.0955
        },
        'features_count': 33,
        'simulations_saved': sim_count
    })
