import os
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request, send_file
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from config import MODEL_DIR, SAMPLE_CSV_PATH
from models_cache import get_loaded_models, get_scalers
from train_engine import MODEL_CONFIGS

inference_bp = Blueprint('inference', __name__, url_prefix='/api')

def transform_raw_to_features(df_input, feature_names):
    df = df_input.copy()
    
    col_map = {
        'Date': 'Date',
        'Coal Electric Power Sector CO2 Emissions': 'Coal',
        'Distillate Fuel, Including Kerosene-Type Jet Fuel, Oil Electric Power Sector CO2 Emissions': 'Distillate_Fuel',
        'Geothermal Energy Electric Power Sector CO2 Emissions': 'Geothermal',
        'Natural Gas Electric Power Sector CO2 Emissions': 'Natural_Gas',
        'Non-Biomass Waste Electric Power Sector CO2 Emissions': 'Non_Biomass_Waste',
        'Petroleum Coke Electric Power Sector CO2 Emissions': 'Petroleum_Coke',
        'Petroleum Electric Power Sector CO2 Emissions': 'Petroleum',
        'Residual Fuel Oil Electric Power Sector CO2 Emissions': 'Residual_Fuel_Oil',
        'Total Energy Electric Power Sector CO2 Emissions': 'Total_CO2'
    }
    df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)
    
    for c in ['Coal', 'Distillate_Fuel', 'Geothermal', 'Natural_Gas', 'Non_Biomass_Waste', 'Petroleum_Coke', 'Petroleum', 'Residual_Fuel_Oil']:
        if c not in df.columns:
            df[c] = 0.0
        df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0.0)

    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    else:
        df['Date'] = pd.date_range(start='2020-01-01', periods=len(df), freq='MS')

    has_ground_truth = 'Total_CO2' in df.columns
    if not has_ground_truth:
        df['Total_CO2'] = df['Coal'] + df['Natural_Gas'] + df['Petroleum'] + df['Residual_Fuel_Oil'] + df['Distillate_Fuel'] + 0.35
    else:
        df['Total_CO2'] = pd.to_numeric(df['Total_CO2'], errors='coerce').fillna(df['Coal'] + df['Natural_Gas'] + df['Petroleum'])

    df['Year'] = df['Date'].dt.year.fillna(2020).astype(int)
    df['Month'] = df['Date'].dt.month.fillna(6).astype(int)
    df['Quarter'] = df['Date'].dt.quarter.fillna(2).astype(int)
    df['DayOfYear'] = df['Date'].dt.dayofyear.fillna(150).astype(int)
    df['Month_Sin'] = np.sin(2 * np.pi * df['Month'] / 12.0)
    df['Month_Cos'] = np.cos(2 * np.pi * df['Month'] / 12.0)

    df['Lag_1'] = df['Total_CO2'].shift(1).bfill().ffill()
    df['Lag_2'] = df['Total_CO2'].shift(2).bfill().ffill()
    df['Lag_3'] = df['Total_CO2'].shift(3).bfill().ffill()
    df['Lag_12'] = df['Total_CO2'].shift(12).bfill().ffill()

    df['Coal_Lag1'] = df['Coal'].shift(1).bfill().ffill()
    df['Natural_Gas_Lag1'] = df['Natural_Gas'].shift(1).bfill().ffill()
    df['Petroleum_Lag1'] = df['Petroleum'].shift(1).bfill().ffill()

    df['Roll_Mean_3'] = df['Total_CO2'].rolling(3, min_periods=1).mean()
    df['Roll_Mean_6'] = df['Total_CO2'].rolling(6, min_periods=1).mean()
    df['Roll_Mean_12'] = df['Total_CO2'].rolling(12, min_periods=1).mean()
    df['Roll_Std_3'] = df['Total_CO2'].rolling(3, min_periods=1).std().fillna(0.0)
    df['Roll_Std_6'] = df['Total_CO2'].rolling(6, min_periods=1).std().fillna(0.0)
    df['EMA_3'] = df['Total_CO2'].ewm(span=3, adjust=False).mean()
    df['EMA_6'] = df['Total_CO2'].ewm(span=6, adjust=False).mean()

    df['Coal_Share'] = df['Coal'] / (df['Total_CO2'] + 1e-5)
    df['Natural_Gas_Share'] = df['Natural_Gas'] / (df['Total_CO2'] + 1e-5)
    df['Petroleum_Share'] = df['Petroleum'] / (df['Total_CO2'] + 1e-5)
    df['Diff_1'] = (df['Total_CO2'] - df['Lag_1']).fillna(0.0)
    df['Diff_12'] = (df['Total_CO2'] - df['Lag_12']).fillna(0.0)

    if feature_names:
        for fn in feature_names:
            if fn not in df.columns:
                df[fn] = 0.0

    return df, has_ground_truth

@inference_bp.route('/test-csv', methods=['POST'])
def test_csv_inference():
    try:
        models_dict = get_loaded_models()
        scaler_X, scaler_y, feature_names = get_scalers()

        model_name = request.form.get('model_name', 'Ridge Regression')
        if model_name not in MODEL_CONFIGS and model_name not in models_dict:
            model_name = 'Ridge Regression'

        if 'file' in request.files:
            uploaded_file = request.files['file']
            if uploaded_file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            df_raw = pd.read_csv(uploaded_file)
        else:
            json_data = request.get_json()
            if not json_data or 'data' not in json_data:
                return jsonify({'error': 'No CSV file or data provided'}), 400
            df_raw = pd.DataFrame(json_data['data'])

        if df_raw.empty:
            return jsonify({'error': 'Uploaded data is empty'}), 400

        df_processed, has_ground_truth = transform_raw_to_features(df_raw, feature_names)

        X_input = scaler_X.transform(df_processed[feature_names].values)

        if model_name in ['LSTM', 'GRU', 'CNN-LSTM', 'Stacked BiGRU']:
            import tensorflow as tf
            keras_file = MODEL_CONFIGS[model_name]['file']
            dl_path = os.path.join(MODEL_DIR, keras_file)
            dl_model = tf.keras.models.load_model(dl_path)

            seq_len = 12
            if len(X_input) >= seq_len:
                Xs = []
                for i in range(len(X_input) - seq_len + 1):
                    Xs.append(X_input[i:(i + seq_len)])
                Xs = np.array(Xs)
                y_pred_sub = dl_model.predict(Xs, verbose=0).ravel()
                pad_len = len(X_input) - len(y_pred_sub)
                if pad_len > 0:
                    y_pred_norm = np.concatenate([np.repeat(y_pred_sub[0], pad_len), y_pred_sub])
                else:
                    y_pred_norm = y_pred_sub
            else:
                repeat_cnt = int(np.ceil(seq_len / max(1, len(X_input))))
                tiled = np.tile(X_input, (repeat_cnt, 1))[-seq_len:]
                sample_seq = np.expand_dims(tiled, axis=0)
                single_pred = float(dl_model.predict(sample_seq, verbose=0).ravel()[0])
                y_pred_norm = np.full(len(X_input), single_pred)

            y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()
        else:
            selected_model = models_dict.get(model_name, models_dict.get('Ridge Regression'))
            y_pred_norm = selected_model.predict(X_input)
            y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()

        results_list = []
        actuals_list = []
        preds_list = []

        for idx in range(len(df_processed)):
            row_date = str(df_processed.iloc[idx]['Date'].strftime('%Y-%m-%d')) if pd.notnull(df_processed.iloc[idx]['Date']) else f"Row {idx+1}"
            pred_val = round(float(y_pred_mmt[idx]), 2)
            preds_list.append(pred_val)

            item = {
                'row_index': idx + 1,
                'date': row_date,
                'predicted_co2': pred_val,
                'coal': round(float(df_processed.iloc[idx]['Coal']), 2),
                'natural_gas': round(float(df_processed.iloc[idx]['Natural_Gas']), 2),
                'petroleum': round(float(df_processed.iloc[idx]['Petroleum']), 2)
            }

            if has_ground_truth:
                act_val = round(float(df_processed.iloc[idx]['Total_CO2']), 2)
                actuals_list.append(act_val)
                residual = round(act_val - pred_val, 2)
                pct_err = round(abs(residual / act_val) * 100, 2) if act_val != 0 else 0.0

                item['actual_co2'] = act_val
                item['residual'] = residual
                item['pct_error'] = pct_err

            results_list.append(item)

        computed_metrics = None
        if has_ground_truth and len(actuals_list) > 1:
            mse_val = float(mean_squared_error(actuals_list, preds_list))
            rmse_val = float(np.sqrt(mse_val))
            mae_val = float(mean_absolute_error(actuals_list, preds_list))
            r2_val = float(r2_score(actuals_list, preds_list))

            computed_metrics = {
                'rmse_mmt': round(rmse_val, 4),
                'mae_mmt': round(mae_val, 4),
                'mse_mmt': round(mse_val, 4),
                'r2': round(r2_val, 4)
            }

        return jsonify({
            'success': True,
            'model_used': model_name,
            'total_rows_evaluated': len(results_list),
            'has_ground_truth': has_ground_truth,
            'computed_metrics': computed_metrics,
            'results': results_list
        })

    except Exception as e:
        return jsonify({'error': f"Failed to process CSV: {str(e)}"}), 500

@inference_bp.route('/sample-csv', methods=['GET'])
def get_sample_csv():
    if os.path.exists(SAMPLE_CSV_PATH):
        return send_file(SAMPLE_CSV_PATH, mimetype='text/csv', as_attachment=True, download_name='sample_co2_test_data.csv')
    return jsonify({'error': 'Sample file not found'}), 404
