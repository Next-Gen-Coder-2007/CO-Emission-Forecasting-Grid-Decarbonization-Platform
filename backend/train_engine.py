import os
import time
import json
import sqlite3
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.svm import SVR
import lightgbm as lgb
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import DB_PATH, MODEL_DIR, CSV_PATH, BASE_DIR, ROOT_DIR

MODEL_CONFIGS = {
    'Ridge Regression': {
        'type': 'ml',
        'file': 'RidgeRegression.pkl',
        'color': '#06b6d4',
        'db_col': 'ridge_pred',
        'default_params': {'alpha': 1.0}
    },
    'LightGBM': {
        'type': 'ml',
        'file': 'LightGBM.pkl',
        'color': '#10b981',
        'db_col': 'lightgbm_pred',
        'default_params': {'n_estimators': 150, 'learning_rate': 0.05, 'max_depth': 6, 'num_leaves': 31}
    },
    'XGBoost': {
        'type': 'ml',
        'file': 'XGBoost.pkl',
        'color': '#f59e0b',
        'db_col': 'xgboost_pred',
        'default_params': {'n_estimators': 150, 'learning_rate': 0.05, 'max_depth': 5}
    },
    'SVM': {
        'type': 'ml',
        'file': 'SVM.pkl',
        'color': '#8b5cf6',
        'db_col': 'svm_pred',
        'default_params': {'C': 10.0, 'epsilon': 0.05, 'kernel': 'rbf'}
    },
    'LSTM': {
        'type': 'dl',
        'file': 'LSTM_model.keras',
        'color': '#db2777',
        'db_col': 'lstm_pred',
        'default_params': {'epochs': 15, 'units': 64, 'batch_size': 16, 'learning_rate': 0.001}
    },
    'GRU': {
        'type': 'dl',
        'file': 'GRU_model.keras',
        'color': '#0284c7',
        'db_col': 'gru_pred',
        'default_params': {'epochs': 15, 'units': 64, 'batch_size': 16, 'learning_rate': 0.001}
    },
    'CNN-LSTM': {
        'type': 'dl',
        'file': 'CNN_LSTM_model.keras',
        'color': '#0ea5e9',
        'db_col': 'cnn_lstm_pred',
        'default_params': {'epochs': 15, 'units': 48, 'batch_size': 16, 'learning_rate': 0.001}
    },
    'Stacked BiGRU': {
        'type': 'dl',
        'file': 'Stacked_BiGRU.keras',
        'color': '#7c3aed',
        'db_col': 'bigru_pred',
        'default_params': {'epochs': 15, 'units': 48, 'batch_size': 16, 'learning_rate': 0.001}
    }
}

def load_data_and_scalers():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Dataset not found at {CSV_PATH}")
    
    df = pd.read_csv(CSV_PATH)
    scaler_X_path = os.path.join(MODEL_DIR, "scaler_X.pkl")
    scaler_y_path = os.path.join(MODEL_DIR, "scaler_y.pkl")
    feat_names_path = os.path.join(MODEL_DIR, "feature_names.pkl")

    if not (os.path.exists(scaler_X_path) and os.path.exists(scaler_y_path) and os.path.exists(feat_names_path)):
        raise FileNotFoundError("Pre-fitted scalers or feature_names not found in UI/models")

    scaler_X = joblib.load(scaler_X_path)
    scaler_y = joblib.load(scaler_y_path)
    feature_names = joblib.load(feat_names_path)

    split_idx = int(len(df) * 0.85)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train_raw = train_df[feature_names].values
    y_train_raw = train_df['Total_CO2'].values.reshape(-1, 1)

    X_test_raw = test_df[feature_names].values
    y_test_raw = test_df['Total_CO2'].values.reshape(-1, 1)

    X_train = scaler_X.transform(X_train_raw)
    y_train = scaler_y.transform(y_train_raw).ravel()

    X_test = scaler_X.transform(X_test_raw)
    y_test = scaler_y.transform(y_test_raw).ravel()

    return {
        'df': df,
        'train_df': train_df,
        'test_df': test_df,
        'feature_names': feature_names,
        'scaler_X': scaler_X,
        'scaler_y': scaler_y,
        'X_train': X_train,
        'y_train': y_train,
        'X_test': X_test,
        'y_test': y_test,
        'y_test_raw_mmt': y_test_raw.ravel(),
        'test_dates': test_df['Date'].tolist()
    }

def compute_histogram(residuals, num_bins=15):
    res = np.array(residuals)
    counts, bin_edges = np.histogram(res, bins=num_bins)
    bins = []
    for i in range(len(counts)):
        mid = (bin_edges[i] + bin_edges[i+1]) / 2.0
        bins.append({
            'bin_start': round(float(bin_edges[i]), 2),
            'bin_end': round(float(bin_edges[i+1]), 2),
            'bin_mid': round(float(mid), 2),
            'count': int(counts[i])
        })
    return bins

def train_model_backend(model_name, hyperparams=None):
    start_time = time.time()
    if model_name not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model name: {model_name}. Available: {list(MODEL_CONFIGS.keys())}")

    cfg = MODEL_CONFIGS[model_name]
    params = dict(cfg['default_params'])
    if hyperparams and isinstance(hyperparams, dict):
        for k, v in hyperparams.items():
            if k in params:
                try:
                    params[k] = type(params[k])(v)
                except Exception:
                    params[k] = v

    data = load_data_and_scalers()
    X_train, y_train = data['X_train'], data['y_train']
    X_test, y_test = data['X_test'], data['y_test']
    y_test_raw_mmt = data['y_test_raw_mmt']
    scaler_y = data['scaler_y']
    feature_names = data['feature_names']
    test_dates = data['test_dates']

    loss_history = []
    model_obj = None
    feature_importances = []

    if model_name == 'Ridge Regression':
        model_obj = Ridge(alpha=float(params['alpha']))
        model_obj.fit(X_train, y_train)
        
        coefs = np.abs(model_obj.coef_)
        sorted_idx = np.argsort(coefs)[::-1][:15]
        for idx in sorted_idx:
            feature_importances.append({
                'feature': feature_names[idx],
                'importance': round(float(coefs[idx]), 4)
            })
        
        loss_history = [
            {'epoch': 1, 'loss': round(float(mean_squared_error(y_train, model_obj.predict(X_train))), 6)}
        ]

    elif model_name == 'LightGBM':
        lgb_params = {
            'objective': 'regression',
            'metric': 'rmse',
            'learning_rate': float(params.get('learning_rate', 0.05)),
            'n_estimators': int(params.get('n_estimators', 150)),
            'max_depth': int(params.get('max_depth', 6)),
            'num_leaves': int(params.get('num_leaves', 31)),
            'random_state': 42,
            'verbose': -1
        }
        model_obj = lgb.LGBMRegressor(**lgb_params)
        model_obj.fit(X_train, y_train, eval_set=[(X_train, y_train), (X_test, y_test)])
        
        evals = model_obj.evals_result_
        if evals and 'valid_0' in evals:
            tr_losses = evals['valid_0']['rmse']
            te_losses = evals['valid_1']['rmse'] if 'valid_1' in evals else tr_losses
            step = max(1, len(tr_losses) // 20)
            for ep in range(0, len(tr_losses), step):
                loss_history.append({
                    'epoch': ep + 1,
                    'train_loss': round(float(tr_losses[ep]), 5),
                    'val_loss': round(float(te_losses[ep]), 5)
                })

        imp = model_obj.feature_importances_
        sorted_idx = np.argsort(imp)[::-1][:15]
        for idx in sorted_idx:
            feature_importances.append({
                'feature': feature_names[idx],
                'importance': round(float(imp[idx]), 2)
            })

    elif model_name == 'XGBoost':
        xgb_params = {
            'objective': 'reg:squarederror',
            'learning_rate': float(params.get('learning_rate', 0.05)),
            'n_estimators': int(params.get('n_estimators', 150)),
            'max_depth': int(params.get('max_depth', 5)),
            'random_state': 42,
            'verbosity': 0
        }
        model_obj = xgb.XGBRegressor(**xgb_params)
        model_obj.fit(X_train, y_train, eval_set=[(X_train, y_train), (X_test, y_test)], verbose=False)
        
        evals = model_obj.evals_result()
        if evals and 'validation_0' in evals:
            tr_losses = evals['validation_0']['rmse']
            te_losses = evals['validation_1']['rmse'] if 'validation_1' in evals else tr_losses
            step = max(1, len(tr_losses) // 20)
            for ep in range(0, len(tr_losses), step):
                loss_history.append({
                    'epoch': ep + 1,
                    'train_loss': round(float(tr_losses[ep]), 5),
                    'val_loss': round(float(te_losses[ep]), 5)
                })

        imp = model_obj.feature_importances_
        sorted_idx = np.argsort(imp)[::-1][:15]
        for idx in sorted_idx:
            feature_importances.append({
                'feature': feature_names[idx],
                'importance': round(float(imp[idx]), 4)
            })

    elif model_name == 'SVM':
        model_obj = SVR(
            C=float(params.get('C', 10.0)),
            epsilon=float(params.get('epsilon', 0.05)),
            kernel=str(params.get('kernel', 'rbf'))
        )
        model_obj.fit(X_train, y_train)
        loss_history = [
            {'epoch': 1, 'loss': round(float(mean_squared_error(y_train, model_obj.predict(X_train))), 6)}
        ]

    elif model_name in ['LSTM', 'GRU', 'CNN-LSTM', 'Stacked BiGRU']:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, GRU, Dense, Dropout, Bidirectional, Conv1D, MaxPooling1D
        from tensorflow.keras.optimizers import Adam

        seq_len = 12
        def create_sequences(X, y, time_steps=seq_len):
            Xs, ys = [], []
            for i in range(len(X) - time_steps):
                Xs.append(X[i:(i + time_steps)])
                ys.append(y[i + time_steps])
            return np.array(Xs), np.array(ys)

        X_all = np.vstack([X_train, X_test])
        y_all = np.concatenate([y_train, y_test])
        X_seq, y_seq = create_sequences(X_all, y_all, seq_len)

        train_size = len(X_train) - seq_len
        X_train_seq = X_seq[:train_size]
        y_train_seq = y_seq[:train_size]
        X_test_seq = X_seq[train_size:]
        y_test_seq = y_seq[train_size:]

        units = int(params.get('units', 64))
        epochs = int(params.get('epochs', 15))
        batch_size = int(params.get('batch_size', 16))
        lr = float(params.get('learning_rate', 0.001))

        if model_name == 'LSTM':
            model = Sequential([
                Bidirectional(LSTM(units, return_sequences=True), input_shape=(seq_len, X_train.shape[1])),
                Dropout(0.2),
                LSTM(units // 2, return_sequences=False),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(1)
            ])
        elif model_name == 'GRU':
            model = Sequential([
                GRU(units, return_sequences=True, input_shape=(seq_len, X_train.shape[1])),
                Dropout(0.2),
                GRU(units // 2, return_sequences=False),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(1)
            ])
        elif model_name == 'CNN-LSTM':
            model = Sequential([
                Conv1D(filters=32, kernel_size=3, padding='same', activation='relu', input_shape=(seq_len, X_train.shape[1])),
                MaxPooling1D(pool_size=2, padding='same'),
                Bidirectional(LSTM(units, return_sequences=False)),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(1)
            ])
        elif model_name == 'Stacked BiGRU':
            model = Sequential([
                Bidirectional(GRU(units, return_sequences=True), input_shape=(seq_len, X_train.shape[1])),
                Dropout(0.2),
                Bidirectional(GRU(units // 2, return_sequences=False)),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(1)
            ])

        model.compile(optimizer=Adam(learning_rate=lr), loss='mse', metrics=['mae'])

        hist = model.fit(
            X_train_seq, y_train_seq,
            validation_data=(X_test_seq, y_test_seq),
            epochs=epochs,
            batch_size=batch_size,
            verbose=0
        )

        model_obj = model
        for ep in range(epochs):
            loss_history.append({
                'epoch': ep + 1,
                'train_loss': round(float(hist.history['loss'][ep]), 5),
                'val_loss': round(float(hist.history['val_loss'][ep]), 5)
            })

    save_path = os.path.join(MODEL_DIR, cfg['file'])
    if cfg['type'] == 'dl':
        model_obj.save(save_path)
    else:
        joblib.dump(model_obj, save_path)

    if cfg['type'] == 'dl':
        y_pred_norm_seq = model_obj.predict(X_test_seq).ravel()
        pad_len = len(y_test) - len(y_pred_norm_seq)
        if pad_len > 0:
            first_val = y_pred_norm_seq[0]
            y_pred_norm = np.concatenate([np.repeat(first_val, pad_len), y_pred_norm_seq])
        else:
            y_pred_norm = y_pred_norm_seq
    else:
        y_pred_norm = model_obj.predict(X_test)

    y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()

    mse_norm = float(mean_squared_error(y_test, y_pred_norm))
    rmse_norm = float(np.sqrt(mse_norm))
    mae_norm = float(mean_absolute_error(y_test, y_pred_norm))
    r2_val = float(r2_score(y_test, y_pred_norm))

    mse_mmt = float(mean_squared_error(y_test_raw_mmt, y_pred_mmt))
    rmse_mmt = float(np.sqrt(mse_mmt))
    mae_mmt = float(mean_absolute_error(y_test_raw_mmt, y_pred_mmt))

    residuals_mmt = (y_test_raw_mmt - y_pred_mmt).tolist()
    hist_bins = compute_histogram(residuals_mmt, num_bins=15)

    point_records = []
    for i in range(len(test_dates)):
        act = round(float(y_test_raw_mmt[i]), 2)
        prd = round(float(y_pred_mmt[i]), 2)
        res = round(act - prd, 2)
        pct = round(abs(res / act) * 100, 2) if act != 0 else 0.0
        point_records.append({
            'date': str(test_dates[i]),
            'actual_mmt': act,
            'predicted_mmt': prd,
            'residual_mmt': res,
            'pct_error': pct
        })

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE models_registry 
        SET r2 = ?, rmse = ?, mae = ?, mse = ?, hyperparameters = ?
        WHERE model_name = ?
        """, (
            round(r2_val, 4),
            round(rmse_norm, 4),
            round(mae_norm, 4),
            round(mse_norm, 4),
            json.dumps(params),
            model_name
        ))

        db_col = cfg['db_col']
        cursor.execute("SELECT id FROM predictions_timeseries ORDER BY id ASC")
        ids = [row[0] for row in cursor.fetchall()]
        for i, row_id in enumerate(ids):
            if i < len(y_pred_mmt):
                cursor.execute(f"UPDATE predictions_timeseries SET {db_col} = ? WHERE id = ?", (round(float(y_pred_mmt[i]), 2), row_id))

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database sync warning: {e}")

    elapsed_time = round(time.time() - start_time, 2)

    return {
        'success': True,
        'model_name': model_name,
        'model_type': cfg['type'],
        'hyperparameters': params,
        'training_time_seconds': elapsed_time,
        'metrics': {
            'r2': round(r2_val, 4),
            'rmse_normalized': round(rmse_norm, 4),
            'mae_normalized': round(mae_norm, 4),
            'mse_normalized': round(mse_norm, 4),
            'rmse_mmt': round(rmse_mmt, 4),
            'mae_mmt': round(mae_mmt, 4),
            'mse_mmt': round(mse_mmt, 4)
        },
        'loss_history': loss_history,
        'feature_importances': feature_importances,
        'residuals_histogram': hist_bins,
        'point_records': point_records
    }

def get_dynamic_charts_data(selected_model='Ridge Regression'):
    data = load_data_and_scalers()
    X_test, y_test = data['X_test'], data['y_test']
    y_test_raw_mmt = data['y_test_raw_mmt']
    scaler_y = data['scaler_y']
    feature_names = data['feature_names']
    test_dates = data['test_dates']

    loaded_models = {}
    preds_mmt = {}
    for m_name, cfg in MODEL_CONFIGS.items():
        m_path = os.path.join(MODEL_DIR, cfg['file'])
        if os.path.exists(m_path):
            try:
                if cfg['type'] == 'dl':
                    import tensorflow as tf
                    loaded_models[m_name] = tf.keras.models.load_model(m_path)
                    seq_len = 12
                    X_all = np.vstack([data['X_train'], X_test])
                    Xs = []
                    for i in range(len(X_all) - seq_len):
                        Xs.append(X_all[i:(i + seq_len)])
                    Xs = np.array(Xs)
                    train_size = len(data['X_train']) - seq_len
                    X_test_seq = Xs[train_size:]
                    y_p_norm = loaded_models[m_name].predict(X_test_seq, verbose=0).ravel()
                    pad_len = len(y_test) - len(y_p_norm)
                    if pad_len > 0:
                        y_p_norm = np.concatenate([np.repeat(y_p_norm[0], pad_len), y_p_norm])
                    preds_mmt[m_name] = scaler_y.inverse_transform(y_p_norm.reshape(-1, 1)).ravel()
                else:
                    loaded_models[m_name] = joblib.load(m_path)
                    y_p_norm = loaded_models[m_name].predict(X_test)
                    preds_mmt[m_name] = scaler_y.inverse_transform(y_p_norm.reshape(-1, 1)).ravel()
            except Exception as e:
                print(f"Chart load error for {m_name}: {e}")

    timeseries = []
    for i in range(len(test_dates)):
        entry = {
            'date': str(test_dates[i]),
            'actual_mmt': round(float(y_test_raw_mmt[i]), 2)
        }
        for m_name in preds_mmt:
            if i < len(preds_mmt[m_name]):
                entry[m_name] = round(float(preds_mmt[m_name][i]), 2)
        timeseries.append(entry)

    target_preds = preds_mmt.get(selected_model, preds_mmt.get('Ridge Regression', y_test_raw_mmt))
    residuals_mmt = (y_test_raw_mmt - target_preds).tolist()
    residuals_hist = compute_histogram(residuals_mmt, num_bins=15)

    parity_points = []
    for i in range(len(test_dates)):
        parity_points.append({
            'date': str(test_dates[i]),
            'actual': round(float(y_test_raw_mmt[i]), 2),
            'predicted': round(float(target_preds[i]), 2),
            'residual': round(float(y_test_raw_mmt[i] - target_preds[i]), 2)
        })

    feat_imp = []
    target_model_obj = loaded_models.get(selected_model, loaded_models.get('Ridge Regression'))
    if target_model_obj is not None:
        if hasattr(target_model_obj, 'feature_importances_'):
            imp = target_model_obj.feature_importances_
            sorted_idx = np.argsort(imp)[::-1][:15]
            for idx in sorted_idx:
                feat_imp.append({'feature': feature_names[idx], 'importance': round(float(imp[idx]), 3)})
        elif hasattr(target_model_obj, 'coef_'):
            coefs = np.abs(target_model_obj.coef_)
            sorted_idx = np.argsort(coefs)[::-1][:15]
            for idx in sorted_idx:
                feat_imp.append({'feature': feature_names[idx], 'importance': round(float(coefs[idx]), 4)})

    return {
        'selected_model': selected_model,
        'timeseries': timeseries,
        'residuals_histogram': residuals_hist,
        'parity_points': parity_points,
        'feature_importances': feat_imp
    }

if __name__ == '__main__':
    res = train_model_backend('Ridge Regression', {'alpha': 1.0})
    print("Training test result:", json.dumps({k: v for k, v in res.items() if k != 'point_records'}, indent=2))
