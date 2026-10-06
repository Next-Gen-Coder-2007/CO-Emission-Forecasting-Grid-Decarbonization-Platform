import os
import json
import sqlite3
import pandas as pd
from datetime import datetime

import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import DB_PATH, BASE_DIR, ROOT_DIR



def init_database():
    print(f"Initializing SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create emissions_data table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emissions_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        coal REAL,
        distillate_fuel REAL,
        geothermal REAL,
        natural_gas REAL,
        non_biomass_waste REAL,
        petroleum_coke REAL,
        petroleum REAL,
        residual_fuel_oil REAL,
        total_co2 REAL,
        year INTEGER,
        month INTEGER,
        quarter INTEGER,
        month_sin REAL,
        month_cos REAL,
        lag_1 REAL,
        lag_2 REAL,
        lag_3 REAL,
        lag_12 REAL,
        roll_mean_3 REAL,
        roll_std_3 REAL,
        coal_share REAL,
        natural_gas_share REAL,
        petroleum_share REAL
    )
    """)

    # 2. Create models_registry table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS models_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT UNIQUE NOT NULL,
        model_type TEXT NOT NULL,
        r2 REAL NOT NULL,
        rmse REAL NOT NULL,
        mae REAL NOT NULL,
        mse REAL NOT NULL,
        hyperparameters TEXT,
        architecture TEXT,
        color_hex TEXT,
        rank INTEGER
    )
    """)

    # 3. Create scenario_simulations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenario_simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        coal REAL NOT NULL,
        natural_gas REAL NOT NULL,
        petroleum REAL NOT NULL,
        residual_fuel REAL NOT NULL,
        distillate_fuel REAL NOT NULL,
        month INTEGER NOT NULL,
        predicted_total_co2 REAL NOT NULL,
        carbon_intensity TEXT NOT NULL
    )
    """)

    # 4. Create predictions_timeseries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions_timeseries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        actual REAL,
        ridge_pred REAL,
        lightgbm_pred REAL,
        xgboost_pred REAL,
        svm_pred REAL,
        lstm_pred REAL,
        gru_pred REAL
    )
    """)

    conn.commit()

    # Seed emissions_data from preprocessed_co2_dataset.csv
    csv_path = os.path.join(BASE_DIR, "preprocessed_co2_dataset.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        cursor.execute("SELECT COUNT(*) FROM emissions_data")
        count = cursor.fetchone()[0]
        if count == 0:
            print(f"Seeding emissions_data from {csv_path} ({len(df)} rows)...")
            for _, row in df.iterrows():
                cursor.execute("""
                INSERT INTO emissions_data (
                    date, coal, distillate_fuel, geothermal, natural_gas, non_biomass_waste,
                    petroleum_coke, petroleum, residual_fuel_oil, total_co2, year, month, quarter,
                    month_sin, month_cos, lag_1, lag_2, lag_3, lag_12, roll_mean_3, roll_std_3,
                    coal_share, natural_gas_share, petroleum_share
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(row['Date']), float(row['Coal']), float(row['Distillate_Fuel']), float(row['Geothermal']),
                    float(row['Natural_Gas']), float(row['Non_Biomass_Waste']), float(row['Petroleum_Coke']),
                    float(row['Petroleum']), float(row['Residual_Fuel_Oil']), float(row['Total_CO2']),
                    int(row['Year']), int(row['Month']), int(row['Quarter']), float(row['Month_Sin']),
                    float(row['Month_Cos']), float(row['Lag_1']), float(row['Lag_2']), float(row['Lag_3']),
                    float(row['Lag_12']), float(row['Roll_Mean_3']), float(row['Roll_Std_3']),
                    float(row['Coal_Share']), float(row['Natural_Gas_Share']), float(row['Petroleum_Share'])
                ))
            conn.commit()
            print("Emissions data seeded successfully.")

    # Seed models_registry from ml_results.csv and dl_results.csv
    cursor.execute("SELECT COUNT(*) FROM models_registry")
    if cursor.fetchone()[0] == 0:
        ml_path = os.path.join(BASE_DIR, "ml_results.csv")
        dl_path = os.path.join(BASE_DIR, "dl_results.csv")

        
        models_data = []
        if os.path.exists(ml_path):
            ml_df = pd.read_csv(ml_path)
            for _, r in ml_df.iterrows():
                models_data.append({
                    'name': str(r['Model']),
                    'type': 'ml',
                    'r2': float(r['R2']),
                    'rmse': float(r['RMSE']),
                    'mae': float(r['MAE']),
                    'mse': float(r['MSE']),
                    'params': str(r.get('Best_Params', 'Optimized via TimeSeriesSplit')),
                    'arch': 'Classical Machine Learning',
                    'color': '#3b82f6' if 'Ridge' in str(r['Model']) else ('#10b981' if 'Light' in str(r['Model']) else ('#f59e0b' if 'XGB' in str(r['Model']) else '#8b5cf6'))
                })

        if os.path.exists(dl_path):
            dl_df = pd.read_csv(dl_path)
            for _, r in dl_df.iterrows():
                models_data.append({
                    'name': str(r['Model']),
                    'type': 'dl',
                    'r2': float(r['R2']),
                    'rmse': float(r['RMSE']),
                    'mae': float(r['MAE']),
                    'mse': float(r['MSE']),
                    'params': 'Epochs: 50 | Batch: 16 | Adam LR=0.001',
                    'arch': str(r.get('Architecture', 'Sequential Recurrent')),
                    'color': '#0ea5e9' if 'LSTM' in str(r['Model']) else '#ec4899'
                })

        models_data.sort(key=lambda x: x['r2'], reverse=True)
        for rank, m in enumerate(models_data, start=1):
            cursor.execute("""
            INSERT INTO models_registry (
                model_name, model_type, r2, rmse, mae, mse, hyperparameters, architecture, color_hex, rank
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                m['name'], m['type'], m['r2'], m['rmse'], m['mae'], m['mse'],
                m['params'], m['arch'], m['color'], rank
            ))
        conn.commit()
        print(f"Seeded {len(models_data)} models into models_registry.")

    # Seed predictions_timeseries
    pred_path = os.path.join(BASE_DIR, "predictions_data.json")

    if os.path.exists(pred_path):
        cursor.execute("SELECT COUNT(*) FROM predictions_timeseries")
        if cursor.fetchone()[0] == 0:
            with open(pred_path, 'r') as f:
                pdata = json.load(f)
            dates = pdata.get('dates', [])
            actual = pdata.get('actual', [])
            ridge = pdata.get('Ridge Regression', [])
            lgb = pdata.get('LightGBM', [])
            xgb = pdata.get('XGBoost', [])
            svm = pdata.get('SVM', [])
            lstm = pdata.get('LSTM', [])
            gru = pdata.get('GRU', [])

            for i in range(len(dates)):
                cursor.execute("""
                INSERT INTO predictions_timeseries (
                    date, actual, ridge_pred, lightgbm_pred, xgboost_pred, svm_pred, lstm_pred, gru_pred
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dates[i], actual[i] if i < len(actual) else None,
                    ridge[i] if i < len(ridge) else None,
                    lgb[i] if i < len(lgb) else None,
                    xgb[i] if i < len(xgb) else None,
                    svm[i] if i < len(svm) else None,
                    lstm[i] if i < len(lstm) else None,
                    gru[i] if i < len(gru) else None
                ))
            conn.commit()
            print(f"Seeded {len(dates)} prediction series records into SQL.")

    # Seed sample baseline simulations
    cursor.execute("SELECT COUNT(*) FROM scenario_simulations")
    if cursor.fetchone()[0] == 0:
        sample_sims = [
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Summer Peak Baseline", 95.0, 28.0, 15.0, 10.0, 1.5, 7, 149.80, "Moderate Carbon Grid"),
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Winter Heavy Coal Heating", 125.0, 20.0, 22.0, 15.0, 3.2, 1, 185.50, "High Carbon Peak"),
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Decarbonized Clean Gas Transition", 45.0, 48.0, 5.0, 3.0, 0.8, 5, 102.10, "Low Carbon Grid")
        ]
        for s in sample_sims:
            cursor.execute("""
            INSERT INTO scenario_simulations (
                created_at, scenario_name, coal, natural_gas, petroleum, residual_fuel, distillate_fuel, month, predicted_total_co2, carbon_intensity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, s)
        conn.commit()
        print("Seeded sample scenario simulations.")

    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_database()
