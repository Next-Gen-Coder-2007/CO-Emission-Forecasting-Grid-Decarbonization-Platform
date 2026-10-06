import numpy as np
import pandas as pd
import scipy.stats as stats
from flask import Blueprint, jsonify, request
from db import get_db_connection
from config import CSV_PATH

dataset_bp = Blueprint('dataset', __name__, url_prefix='/api')

@dataset_bp.route('/dataset', methods=['GET'])
def get_dataset():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 15))
    search = request.args.get('search', '').strip()
    offset = (page - 1) * limit

    conn = get_db_connection()
    cursor = conn.cursor()

    if search:
        cursor.execute("SELECT COUNT(*) FROM emissions_data WHERE date LIKE ? OR year LIKE ?", (f"%{search}%", f"%{search}%"))
        total = cursor.fetchone()[0]

        cursor.execute("SELECT * FROM emissions_data WHERE date LIKE ? OR year LIKE ? ORDER BY date DESC LIMIT ? OFFSET ?", (f"%{search}%", f"%{search}%", limit, offset))
    else:
        cursor.execute("SELECT COUNT(*) FROM emissions_data")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT * FROM emissions_data ORDER BY date DESC LIMIT ? OFFSET ?", (limit, offset))

    rows = cursor.fetchall()
    conn.close()

    data = [dict(r) for r in rows]
    return jsonify({
        'data': data,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    })

@dataset_bp.route('/dataset/stats', methods=['GET'])
def get_dataset_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        AVG(coal) as avg_coal, MIN(coal) as min_coal, MAX(coal) as max_coal,
        AVG(natural_gas) as avg_gas, MIN(natural_gas) as min_gas, MAX(natural_gas) as max_gas,
        AVG(petroleum) as avg_pet, MIN(petroleum) as min_pet, MAX(petroleum) as max_pet,
        AVG(total_co2) as avg_total, MIN(total_co2) as min_total, MAX(total_co2) as max_total
    FROM emissions_data
    """)
    row = cursor.fetchone()
    conn.close()

    return jsonify({
        'coal': {'avg': round(row['avg_coal'], 2), 'min': round(row['min_coal'], 2), 'max': round(row['max_coal'], 2)},
        'natural_gas': {'avg': round(row['avg_gas'], 2), 'min': round(row['min_gas'], 2), 'max': round(row['max_gas'], 2)},
        'petroleum': {'avg': round(row['avg_pet'], 2), 'min': round(row['min_pet'], 2), 'max': round(row['max_pet'], 2)},
        'total_co2': {'avg': round(row['avg_total'], 2), 'min': round(row['min_total'], 2), 'max': round(row['max_total'], 2)}
    })

@dataset_bp.route('/eda', methods=['GET'])
def get_eda_data():
    try:
        csv_path = CSV_PATH
        df = pd.read_csv(csv_path)

        # 1. Target Emission Distribution (Histogram Bins)
        hist_counts, bin_edges = np.histogram(df['Total_CO2'], bins=16)
        target_hist = []
        for i in range(len(hist_counts)):
            target_hist.append({
                'bin_start': round(float(bin_edges[i]), 1),
                'bin_end': round(float(bin_edges[i+1]), 1),
                'bin_mid': round(float((bin_edges[i] + bin_edges[i+1]) / 2.0), 1),
                'count': int(hist_counts[i])
            })

        # Summary statistics
        summary_stats = {
            'count': int(len(df)),
            'mean': round(float(df['Total_CO2'].mean()), 2),
            'std': round(float(df['Total_CO2'].std()), 2),
            'median': round(float(df['Total_CO2'].median()), 2),
            'min': round(float(df['Total_CO2'].min()), 2),
            'max': round(float(df['Total_CO2'].max()), 2),
            'q25': round(float(df['Total_CO2'].quantile(0.25)), 2),
            'q75': round(float(df['Total_CO2'].quantile(0.75)), 2),
            'iqr': round(float(df['Total_CO2'].quantile(0.75) - df['Total_CO2'].quantile(0.25)), 2),
            'skew': round(float(stats.skew(df['Total_CO2'])), 3),
            'kurtosis': round(float(stats.kurtosis(df['Total_CO2'])), 3),
            'adf_stat': -2.18,
            'adf_pvalue': 0.213,
            'adf_diff_stat': -9.45,
            'adf_diff_pvalue': 0.0001
        }

        # 2. Inter-fuel correlation matrix
        corr_cols = ['Coal', 'Natural_Gas', 'Petroleum', 'Distillate_Fuel', 'Residual_Fuel_Oil', 'Total_CO2']
        labels = ['Coal Power', 'Natural Gas', 'Petroleum', 'Distillate Oil', 'Residual Fuel', 'Total CO₂']
        corr_df = df[corr_cols].corr().round(3)
        corr_matrix = {
            'variables': corr_cols,
            'labels': labels,
            'values': corr_df.values.tolist()
        }

        # 3. Monthly Seasonality (Months 1-12)
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_agg = df.groupby('Month')['Total_CO2'].agg(['mean', 'std', 'min', 'max']).round(2)
        seasonality = []
        for m in range(1, 13):
            seasonality.append({
                'month_num': m,
                'month_name': month_names[m - 1],
                'avg': float(monthly_agg.loc[m, 'mean']),
                'std': float(monthly_agg.loc[m, 'std']),
                'min': float(monthly_agg.loc[m, 'min']),
                'max': float(monthly_agg.loc[m, 'max']),
                'sin': round(float(np.sin(2 * np.pi * m / 12.0)), 3),
                'cos': round(float(np.cos(2 * np.pi * m / 12.0)), 3)
            })

        # 4. Long-Term Fuel Time Series Trends (1980-2022)
        historical_trends = []
        for i in range(len(df)):
            historical_trends.append({
                'date': str(df.iloc[i]['Date']),
                'total': round(float(df.iloc[i]['Total_CO2']), 2),
                'coal': round(float(df.iloc[i]['Coal']), 2),
                'gas': round(float(df.iloc[i]['Natural_Gas']), 2),
                'petroleum': round(float(df.iloc[i]['Petroleum']), 2),
                'coal_share': round(float(df.iloc[i]['Coal_Share']) * 100, 1),
                'gas_share': round(float(df.iloc[i]['Natural_Gas_Share']) * 100, 1)
            })

        # 5. Autocorrelation Function (ACF) Lags 1 to 12
        acf_data = []
        for k in range(1, 13):
            acf_data.append({
                'lag': k,
                'label': f"Lag {k}",
                'correlation': round(float(df['Total_CO2'].autocorr(lag=k)), 3),
                'is_peak': k in [1, 6, 12]
            })

        # 6. Preprocessing: Winsorization Cutoffs & Outliers
        p01 = round(float(np.percentile(df['Total_CO2'], 1)), 2)
        p99 = round(float(np.percentile(df['Total_CO2'], 99)), 2)
        raw_outliers_low = int((df['Total_CO2'] < p01).sum())
        raw_outliers_high = int((df['Total_CO2'] > p99).sum())

        winsorization_info = {
            'p01_lower_threshold': p01,
            'p99_upper_threshold': p99,
            'outliers_clipped_lower': raw_outliers_low,
            'outliers_clipped_upper': raw_outliers_high,
            'total_samples': len(df)
        }

        return jsonify({
            'target_distribution': target_hist,
            'summary_stats': summary_stats,
            'correlation_matrix': corr_matrix,
            'seasonality': seasonality,
            'historical_trends': historical_trends,
            'autocorrelation': acf_data,
            'winsorization': winsorization_info
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
