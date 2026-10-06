import os
import numpy as np
from flask import Blueprint, jsonify, request
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
try:
    from db import get_db_connection
except ImportError:
    from db.connection import get_db_connection

from core.config import MODEL_DIR

from services import (
        get_loaded_models,
        reload_model,
        train_model_backend,
        get_dynamic_charts_data,
        MODEL_CONFIGS
    )

models_bp = Blueprint('models', __name__, url_prefix='/api')

@models_bp.route('/models', methods=['GET'])
def get_models():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM models_registry ORDER BY rank ASC")
    rows = cursor.fetchall()
    conn.close()

    models = []
    scale_range = 156.161

    for r in rows:
        norm_rmse = r['rmse']
        norm_mae = r['mae']
        real_rmse = round(norm_rmse * scale_range, 2)
        real_mae = round(norm_mae * scale_range, 2)

        models.append({
            'id': r['id'],
            'model_name': r['model_name'],
            'model_type': r['model_type'],
            'r2': r['r2'],
            'rmse': r['rmse'],
            'mae': r['mae'],
            'mse': r['mse'],
            'real_rmse_mmt': real_rmse,
            'real_mae_mmt': real_mae,
            'hyperparameters': r['hyperparameters'],
            'architecture': r['architecture'],
            'color_hex': r['color_hex'],
            'rank': r['rank']
        })
    return jsonify(models)

@models_bp.route('/predictions', methods=['GET'])
def get_predictions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions_timeseries ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    dates = [r['date'] for r in rows]
    actual = [r['actual'] for r in rows]
    ridge = [r['ridge_pred'] for r in rows]
    lgb = [r['lightgbm_pred'] for r in rows]
    xgb = [r['xgboost_pred'] for r in rows]
    svm = [r['svm_pred'] for r in rows]
    lstm = [r['lstm_pred'] for r in rows]
    gru = [r['gru_pred'] for r in rows]
    cnn_lstm = [r['cnn_lstm_pred'] for r in rows] if 'cnn_lstm_pred' in rows[0].keys() else lstm
    bigru = [r['bigru_pred'] for r in rows] if 'bigru_pred' in rows[0].keys() else gru

    return jsonify({
        'dates': dates,
        'actual': actual,
        'Ridge Regression': ridge,
        'LightGBM': lgb,
        'XGBoost': xgb,
        'SVM': svm,
        'LSTM': lstm,
        'GRU': gru,
        'CNN-LSTM': cnn_lstm,
        'Stacked BiGRU': bigru
    })

@models_bp.route('/real-evaluation', methods=['GET'])
def get_real_evaluation():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions_timeseries ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        model_field_map = {
            'Ridge Regression': 'ridge_pred',
            'LightGBM': 'lightgbm_pred',
            'XGBoost': 'xgboost_pred',
            'SVM': 'svm_pred',
            'LSTM': 'lstm_pred',
            'GRU': 'gru_pred',
            'CNN-LSTM': 'cnn_lstm_pred',
            'Stacked BiGRU': 'bigru_pred'
        }

        records = []
        actuals = []
        preds_by_model = {m: [] for m in model_field_map}

        for r in rows:
            date_str = str(r['date'])
            actual_val = round(float(r['actual']), 2)
            actuals.append(actual_val)

            rec = {
                'date': date_str,
                'actual_mmt': actual_val
            }

            for m_name, fld in model_field_map.items():
                val = round(float(r[fld]), 2) if fld in r.keys() else actual_val
                rec[f'{fld}_mmt'] = val
                preds_by_model[m_name].append(val)

            rec['residual_mmt'] = round(actual_val - rec['ridge_pred_mmt'], 2)
            rec['pct_error'] = round(abs(rec['residual_mmt'] / actual_val) * 100, 2) if actual_val != 0 else 0.0

            records.append(rec)

        actuals_arr = np.array(actuals)
        metrics_mmt = {}
        for m_name, p_list in preds_by_model.items():
            p_arr = np.array(p_list)
            mse_val = float(mean_squared_error(actuals_arr, p_arr))
            rmse_val = float(np.sqrt(mse_val))
            mae_val = float(mean_absolute_error(actuals_arr, p_arr))
            r2_val = float(r2_score(actuals_arr, p_arr))
            metrics_mmt[m_name] = {
                'rmse_mmt': round(rmse_val, 4),
                'mae_mmt': round(mae_val, 4),
                'mse_mmt': round(mse_val, 4),
                'r2': round(r2_val, 4)
            }

        return jsonify({
            'total_test_points': len(records),
            'metrics_mmt': metrics_mmt,
            'records': records
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/train', methods=['POST'])
def train_model_endpoint():
    try:
        data = request.get_json() or {}
        model_name = data.get('model_name', 'Ridge Regression')
        hyperparams = data.get('hyperparameters', {})

        if model_name not in MODEL_CONFIGS:
            return jsonify({'error': f"Unknown model name: {model_name}"}), 400

        print(f"Triggering training for {model_name} with params {hyperparams}...")
        train_result = train_model_backend(model_name, hyperparams)

        if model_name in ['Ridge Regression', 'LightGBM', 'XGBoost', 'SVM']:
            reload_model(model_name, MODEL_CONFIGS[model_name]['file'])

        return jsonify(train_result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Model training failed: {str(e)}"}), 500

@models_bp.route('/charts/data', methods=['GET'])
def get_charts_data_endpoint():
    try:
        selected_model = request.args.get('model', 'Ridge Regression')
        chart_data = get_dynamic_charts_data(selected_model)
        return jsonify(chart_data)
    except Exception as e:
        return jsonify({'error': f"Failed to compute chart data: {str(e)}"}), 500
