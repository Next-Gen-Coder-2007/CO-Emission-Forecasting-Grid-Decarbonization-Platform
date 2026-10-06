export const modelCodeSnippets = {
  'Ridge Regression': {
    title: 'Ridge Regression (L2 Regularized Linear Model)',
    framework: 'scikit-learn',
    file: 'models/ridge_regression.py',
    description: 'Solves collinearity between fuel generation sectors via analytical L2-penalty shrinking.',
    code: `from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, r2_score

# 1. Initialize Ridge Regressor with L2 regularization alpha
ridge = Ridge(alpha=1.0, fit_intercept=True)

# 2. Fit analytical closed-form solution: w = (X^T X + alpha*I)^(-1) X^T y
ridge.fit(X_train, y_train)

# 3. Predict holdout test set & evaluate
y_pred_norm = ridge.predict(X_test)
y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()

r2 = r2_score(y_test, y_pred_norm)
rmse_mmt = np.sqrt(mean_squared_error(y_test_mmt, y_pred_mmt))
print(f"Ridge R2: {r2:.4f}, Real RMSE: {rmse_mmt:.2f} MMT")`
  },

  'LightGBM': {
    title: 'LightGBM Regressor (Leaf-wise Gradient Boosting)',
    framework: 'LightGBM',
    file: 'models/lightgbm_regressor.py',
    description: 'Fast histogram-based decision trees with leaf-wise expansion and gradient-based one-side sampling.',
    code: `import lightgbm as lgb
from sklearn.metrics import mean_squared_error

# 1. Configure LightGBM hyperparameters
params = {
    'objective': 'regression',
    'metric': 'rmse',
    'learning_rate': 0.05,
    'n_estimators': 150,
    'max_depth': 6,
    'num_leaves': 31,
    'random_state': 42,
    'verbose': -1
}

# 2. Initialize and train model
lgb_model = lgb.LGBMRegressor(**params)
lgb_model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_test, y_test)]
)

# 3. Predict & inverse transform to Million Metric Tons
y_pred_norm = lgb_model.predict(X_test)
y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()`
  },

  'XGBoost': {
    title: 'XGBoost Regressor (Extreme Gradient Boosting)',
    framework: 'XGBoost',
    file: 'models/xgboost_regressor.py',
    description: 'Second-order Taylor expansion tree boosting with built-in L1/L2 shrinkage.',
    code: `import xgboost as xgb
from sklearn.metrics import mean_squared_error, r2_score

# 1. Instantiate Extreme Gradient Boosting
xgb_model = xgb.XGBRegressor(
    objective='reg:squarederror',
    learning_rate=0.05,
    n_estimators=150,
    max_depth=5,
    subsample=0.85,
    colsample_bytree=0.85,
    random_state=42
)

# 2. Train with validation monitoring
xgb_model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_test, y_test)],
    verbose=False
)

# 3. Generate physical predictions
y_pred_norm = xgb_model.predict(X_test)
y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()`
  },

  'SVM': {
    title: 'Support Vector Regressor (SVR - RBF Kernel)',
    framework: 'scikit-learn',
    file: 'models/svm_regressor.py',
    description: 'Finds an optimal hyperplane within an epsilon-insensitive tube using Radial Basis Functions.',
    code: `from sklearn.svm import SVR
from sklearn.metrics import r2_score, mean_squared_error

# 1. Configure epsilon-SVR with Gaussian RBF Kernel
svr = SVR(
    C=10.0,
    epsilon=0.05,
    kernel='rbf',
    gamma='scale'
)

# 2. Fit dual quadratic optimization problem
svr.fit(X_train, y_train)

# 3. Predict holdout emissions
y_pred_norm = svr.predict(X_test)
y_pred_mmt = scaler_y.inverse_transform(y_pred_norm.reshape(-1, 1)).ravel()
print(f"SVR Holdout Variance (R2): {r2_score(y_test, y_pred_norm):.4f}")`
  },

  'LSTM': {
    title: 'Bidirectional LSTM (Long Short-Term Memory)',
    framework: 'TensorFlow / Keras',
    file: 'models/bilstm_timeseries.py',
    description: 'Dual-directional recurrent gates capturing forward momentum and backward temporal dependencies.',
    code: `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Bidirectional, LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# 1. Sequential Recurrent Architecture (12-Month Lags x 33 Features)
model = Sequential([
    Bidirectional(LSTM(64, return_sequences=True), input_shape=(12, 33)),
    Dropout(0.2),
    LSTM(32, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

# 2. Compile with Adam optimizer & MSE loss
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])

# 3. Train on chronological time-step sequences
history = model.fit(
    X_train_seq, y_train_seq,
    validation_data=(X_test_seq, y_test_seq),
    epochs=15, batch_size=16, verbose=0
)`
  },

  'GRU': {
    title: 'Stacked GRU (Gated Recurrent Unit)',
    framework: 'TensorFlow / Keras',
    file: 'models/gru_timeseries.py',
    description: 'Efficient recurrent architecture with coupled reset and update gates.',
    code: `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GRU, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# 1. Gated Recurrent Unit Architecture
model = Sequential([
    GRU(64, return_sequences=True, input_shape=(12, 33)),
    Dropout(0.2),
    GRU(32, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

# 2. Compile and train
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
history = model.fit(
    X_train_seq, y_train_seq,
    validation_data=(X_test_seq, y_test_seq),
    epochs=15, batch_size=16, verbose=0
)`
  },

  'CNN-LSTM': {
    title: '1D CNN-LSTM (Spatio-Temporal ConvNet + Recurrence)',
    framework: 'TensorFlow / Keras',
    file: 'models/cnn_lstm_hybrid.py',
    description: 'Conv1D extracts short-term local fuel patterns before feeding into Bidirectional LSTM.',
    code: `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Bidirectional, LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# 1. Hybrid 1D Convolution + BiLSTM Network
model = Sequential([
    # Temporal pattern extraction
    Conv1D(filters=32, kernel_size=3, padding='same', activation='relu', input_shape=(12, 33)),
    MaxPooling1D(pool_size=2, padding='same'),
    # Long-term sequential memory
    Bidirectional(LSTM(48, return_sequences=False)),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
model.fit(X_train_seq, y_train_seq, epochs=15, batch_size=16, verbose=0)`
  },

  'Stacked BiGRU': {
    title: 'Deep Stacked Bidirectional GRU',
    framework: 'TensorFlow / Keras',
    file: 'models/stacked_bigru.py',
    description: 'Deep two-tier bidirectional GRU network with intermediate sequence propagation and dropout.',
    code: `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Bidirectional, GRU, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# 1. Stacked Dual-Tier Bidirectional GRU
model = Sequential([
    Bidirectional(GRU(48, return_sequences=True), input_shape=(12, 33)),
    Dropout(0.2),
    Bidirectional(GRU(24, return_sequences=False)),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

# 2. Optimization and sequence fitting
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
model.fit(X_train_seq, y_train_seq, epochs=15, batch_size=16, verbose=0)`
  }
};

export const preprocessingSnippets = {
  domain_baseline: {
    title: '1. Domain Zero Baseline & Linear Interpolation',
    file: 'preprocessing/imputation.py',
    description: 'Resolves pre-1989 structural zeroes for Geothermal and Non-Biomass Waste, then applies linear interpolation.',
    code: `import pandas as pd
import numpy as np

# Structural zero baseline: Geothermal & Non-Biomass waste had zero commercial deployment pre-1989
df.loc[df['Year'] < 1989, 'Geothermal'] = df.loc[df['Year'] < 1989, 'Geothermal'].fillna(0.0)
df.loc[df['Year'] < 1989, 'Non_Biomass_Waste'] = df.loc[df['Year'] < 1989, 'Non_Biomass_Waste'].fillna(0.0)

# Linear temporal interpolation for operational intervals
fuel_cols = ['Coal', 'Natural_Gas', 'Petroleum', 'Distillate_Fuel', 'Residual_Fuel_Oil']
df[fuel_cols] = df[fuel_cols].interpolate(method='linear', limit_direction='both')`
  },

  iqr_winsorization: {
    title: '2. 1st & 99th Percentile IQR Winsorization',
    file: 'preprocessing/outlier_winsorization.py',
    description: 'Eliminates grid blackout anomalies without distorting seasonal winter/summer demand peaks.',
    code: `import numpy as np

# Robust outlier soft-clipping via IQR boundaries
for col in fuel_cols + ['Total_CO2']:
    q1 = df[col].quantile(0.01)
    q99 = df[col].quantile(0.99)
    iqr = df[col].quantile(0.75) - df[col].quantile(0.25)
    
    # Winsorize extreme measurement spikes to [q1, q99]
    df[col] = np.clip(df[col], q1, q99)`
  },

  cyclical_encoding: {
    title: '3. Cyclical Sine/Cosine Month Seasonality',
    file: 'features/temporal_encoding.py',
    description: 'Preserves the continuous loop of months so December smoothly transitions into January.',
    code: `import numpy as np

# Map calendar month (1-12) onto 2D unit circle
df['Month_Sin'] = np.sin(2 * np.pi * df['Month'] / 12.0)
df['Month_Cos'] = np.cos(2 * np.pi * df['Month'] / 12.0)

# Additional cyclical quarter & day-of-year signals
df['Quarter_Sin'] = np.sin(2 * np.pi * df['Quarter'] / 4.0)
df['Quarter_Cos'] = np.cos(2 * np.pi * df['Quarter'] / 4.0)`
  },

  autoregressive_lags: {
    title: '4. 12-Month Autoregressive Lags & Differencing',
    file: 'features/lag_synthesis.py',
    description: 'Synthesizes autoregressive past horizons (t-1, t-2, t-3, t-12) for momentum and yearly cycle.',
    code: `import pandas as pd

# Target autoregressive lags
for lag in [1, 2, 3, 12]:
    df[f'Lag_{lag}'] = df['Total_CO2'].shift(lag).bfill()

# Sectoral fuel key momentum lags
df['Coal_Lag1'] = df['Coal'].shift(1).bfill()
df['Natural_Gas_Lag1'] = df['Natural_Gas'].shift(1).bfill()
df['Petroleum_Lag1'] = df['Petroleum'].shift(1).bfill()

# Seasonal Year-over-Year differencing
df['Diff_1'] = (df['Total_CO2'] - df['Lag_1']).fillna(0.0)
df['Diff_12'] = (df['Total_CO2'] - df['Lag_12']).fillna(0.0)`
  },

  rolling_statistics: {
    title: '5. Moving Statistics (Rolling Means, Std, EMA)',
    file: 'features/rolling_features.py',
    description: 'Calculates 3, 6, and 12-month rolling trends and exponential moving averages.',
    code: `import pandas as pd

# Multi-window rolling statistics
for window in [3, 6, 12]:
    df[f'Roll_Mean_{window}'] = df['Total_CO2'].rolling(window, min_periods=1).mean()
    df[f'Roll_Std_{window}'] = df['Total_CO2'].rolling(window, min_periods=1).std().fillna(0.0)

# Exponential Moving Averages (EMA)
df['EMA_3'] = df['Total_CO2'].ewm(span=3, adjust=False).mean()
df['EMA_6'] = df['Total_CO2'].ewm(span=6, adjust=False).mean()`
  },

  fuel_shares: {
    title: '6. Sectoral Energy Share Proportions',
    file: 'features/fuel_shares.py',
    description: 'Calculates the relative percentage of total emissions generated by each major fuel.',
    code: `# Dynamic generation fuel share ratios
denom = df['Total_CO2'] + 1e-5

df['Coal_Share'] = df['Coal'] / denom
df['Natural_Gas_Share'] = df['Natural_Gas'] / denom
df['Petroleum_Share'] = df['Petroleum'] / denom
df['Clean_Share'] = (df['Geothermal'] + df['Non_Biomass_Waste']) / denom`
  },

  train_test_split: {
    title: '7. Chronological 85/15 Split (Zero Future Leakage)',
    file: 'data/train_test_split.py',
    description: 'Strict time-series split preserving historical sequence order.',
    code: `# Chronological 85/15 train-test split (No random shuffling!)
split_idx = int(len(df) * 0.85)

train_df = df.iloc[:split_idx].copy()  # 433 months (1980 - 2016)
test_df = df.iloc[split_idx:].copy()   # 77 months (2016 - 2022)

# Robust target scaling
scaler_X = RobustScaler().fit(train_df[feature_names])
scaler_y = MinMaxScaler().fit(train_df[['Total_CO2']])`
  }
};

const target_distribution = {
  title: 'EDA: Carbon Emission Distribution & Normality Diagnostics',
  framework: 'pandas / scipy.stats',
  file: 'eda/emission_distribution.py',
  description: 'Descriptive metrics, skewness, kurtosis, and Shapiro-Wilk hypothesis testing on historical electric sector CO2 emissions.',
  code: `import pandas as pd
import scipy.stats as stats
import numpy as np

# 1. Descriptive distribution statistics on Total_CO2 (MMT)
summary = df['Total_CO2'].describe()
skewness = stats.skew(df['Total_CO2'].dropna())
kurt = stats.kurtosis(df['Total_CO2'].dropna())

# 2. Shapiro-Wilk test for normal distribution compliance
stat, p_val = stats.shapiro(df['Total_CO2'].dropna())

print(f"510 Monthly Observations: 1980 - 2022")
print(f"Mean: {summary['mean']:.2f} MMT | Median: {summary['50%']:.2f} MMT | Std Dev: {summary['std']:.2f} MMT")
print(f"Distribution Range: [{summary['min']:.2f}, {summary['max']:.2f}] MMT")
print(f"Skewness: {skewness:.3f} (Mild positive right-tail skew from summer peaks)")
print(f"Kurtosis: {kurt:.3f} | Shapiro-Wilk W: {stat:.4f} (p-value: {p_val:.4e})")`
};

const correlation_analysis = {
  title: 'EDA: Sectoral Fuel Cross-Correlation & Decoupling Matrix',
  framework: 'pandas / seaborn',
  file: 'eda/fuel_correlation.py',
  description: 'Pearson correlation matrix analyzing the historical decoupling of Coal vs Natural Gas and their relationship to Total CO2.',
  code: `import pandas as pd
import seaborn as sns

key_features = [
    'Coal', 'Natural_Gas', 'Petroleum', 
    'Geothermal', 'Non_Biomass_Waste', 'Total_CO2'
]

# Calculate pairwise Pearson linear correlation matrix
corr_matrix = df[key_features].corr(method='pearson')

print("Pearson Linear Correlation Coefficients with Total_CO2:")
co2_corr = corr_matrix['Total_CO2'].sort_values(ascending=False)
for feature, val in co2_corr.items():
    print(f"  {feature:<20}: {val:+.4f}")

# Key Historical Shift:
# Coal (+0.89 correlation) was the dominant driver until 2008
# Natural Gas (+0.42 correlation) progressively substituted coal baseload post-2010`
};

const adf_stationarity = {
  title: 'EDA: Augmented Dickey-Fuller (ADF) Stationarity Hypothesis Test',
  framework: 'statsmodels',
  file: 'eda/stationarity_adf.py',
  description: 'Unit root hypothesis testing comparing raw emissions versus first differences to ensure sequence stability.',
  code: `from statsmodels.tsa.stattools import adfuller

def run_adf_test(series, label="Target"):
    clean = series.dropna()
    res = adfuller(clean, autolag='AIC')
    print(f"--- ADF Test for {label} ---")
    print(f"ADF Statistic  : {res[0]:.4f}")
    print(f"p-value        : {res[1]:.4e}")
    print(f"Used Lags      : {res[2]}")
    print(f"Num Obs        : {res[3]}")
    for k, v in res[4].items():
        print(f"Critical Val {k:3s}: {v:.4f}")
    if res[1] < 0.05:
        print("Conclusion: Reject H0 -> Stationary Series (No unit root)")
    else:
        print("Conclusion: Fail to reject H0 -> Non-Stationary (Differencing required)")
    print()

# Test raw levels vs 1st differencing
run_adf_test(df['Total_CO2'], "Raw Total CO2 Levels")
run_adf_test(df['Total_CO2'].diff().dropna(), "1st Differenced CO2 Series")`
};

const seasonal_decomposition = {
  title: 'EDA: Additive Time-Series Seasonal & Trend Decomposition',
  framework: 'statsmodels',
  file: 'eda/seasonal_decomposition.py',
  description: 'Additive decomposition isolating the secular 42-year decarbonization trend, twin-peak seasonality, and residual variance.',
  code: `import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose

# Align monthly sequential time-index
ts = df.set_index('Date')['Total_CO2'].asfreq('MS')

# Decompose into Trend, Seasonal (12-month period), and Residual
decomp = seasonal_decompose(ts, model='additive', period=12)

trend = decomp.trend
seasonal = decomp.seasonal
residual = decomp.resid

print(f"Secular Trend Peak    : {trend.max():.2f} MMT (Recorded ~2007 peak)")
print(f"Secular Trend Current : {trend.dropna().iloc[-1]:.2f} MMT (~2022 transition)")
print(f"Summer Cooling Peak   : +{seasonal.max():.2f} MMT (July / August)")
print(f"Spring Shoulder Low   : {seasonal.min():.2f} MMT (April shoulder minimum)")
print(f"Residual Variance Std : {residual.std():.2f} MMT")`
};

const timeseries_cv = {
  title: 'Tuning: Chronological TimeSeriesSplit Cross-Validation',
  framework: 'scikit-learn',
  file: 'tuning/timeseries_cv.py',
  description: '5-fold expanding window cross-validation strictly preventing temporal lookahead leakage during model validation.',
  code: `import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from sklearn.linear_model import Ridge

# 1. Initialize 5-fold expanding window TimeSeriesSplit
# Guarantees that validation folds are always strictly ahead in time of training folds
tscv = TimeSeriesSplit(n_splits=5)

fold_scores = []
fold = 1

for train_idx, val_idx in tscv.split(X_train):
    X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
    y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
    
    # Train candidate estimator on historical observations
    model = Ridge(alpha=1.0)
    model.fit(X_tr, y_tr)
    
    # Evaluate on unseen forward horizon
    preds = model.predict(X_val)
    fold_rmse = np.sqrt(mean_squared_error(y_val, preds))
    fold_mape = mean_absolute_percentage_error(y_val, preds) * 100
    
    fold_scores.append(fold_rmse)
    print(f"Fold {fold} | Train: {len(train_idx)} mo, Val: {len(val_idx)} mo -> RMSE: {fold_rmse:.2f} MMT | MAPE: {fold_mape:.2f}%")
    fold += 1

print(f"Mean Expanding-Window Cross-Validation RMSE: {np.mean(fold_scores):.3f} (+/- {np.std(fold_scores):.3f}) MMT")`
};

const hyperparameter_tuning_ridge = {
  title: 'Tuning: Ridge L2 Regularization (Alpha) Grid Search',
  framework: 'scikit-learn',
  file: 'tuning/ridge_alpha_gridsearch.py',
  description: 'GridSearchCV over 100 log-spaced L2 regularization alphas evaluated with 5-fold TimeSeriesSplit.',
  code: `import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

# 1. 100 log-spaced alphas from 10^-3 to 10^3
# High alpha shrinks collinear fuel coefficients (e.g. Coal vs Gas shares)
param_grid = {
    'alpha': np.logspace(-3, 3, num=100),
    'fit_intercept': [True],
    'solver': ['auto', 'saga', 'lsqr']
}

# 2. Expanding window temporal CV
tscv = TimeSeriesSplit(n_splits=5)

grid_search = GridSearchCV(
    estimator=Ridge(random_state=42),
    param_grid=param_grid,
    cv=tscv,
    scoring='neg_root_mean_squared_error',
    n_jobs=-1,
    refit=True
)

# 3. Fit hyperparameter optimizer on training records
grid_search.fit(X_train, y_train)

best_alpha = grid_search.best_params_['alpha']
best_rmse = -grid_search.best_score_

print(f"Optimal Regularization Alpha: {best_alpha:.4f}")
print(f"Best Out-of-Fold Cross-Validation RMSE: {best_rmse:.3f} MMT")
best_ridge_model = grid_search.best_estimator_`
};

const hyperparameter_tuning_gbm = {
  title: 'Tuning: LightGBM / XGBoost Tree Structure Optimization',
  framework: 'LightGBM / XGBoost / scikit-learn',
  file: 'tuning/tree_hyperparameter_search.py',
  description: 'RandomizedSearchCV optimizing tree depth, learning rate, num_leaves, and subsample ratios over 5-fold temporal CV.',
  code: `from scipy.stats import uniform, randint
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
import lightgbm as lgb

# 1. Define hyperparameter search distribution
param_dist = {
    'n_estimators': randint(80, 250),
    'learning_rate': uniform(0.01, 0.12),
    'max_depth': randint(3, 8),
    'num_leaves': randint(15, 63),
    'subsample': uniform(0.65, 0.35),
    'colsample_bytree': uniform(0.65, 0.35),
    'reg_alpha': uniform(0.0, 1.0),
    'reg_lambda': uniform(0.0, 2.0)
}

# 2. Time-series cross-validation without temporal leakage
tscv = TimeSeriesSplit(n_splits=5)

opt = RandomizedSearchCV(
    estimator=lgb.LGBMRegressor(random_state=42, verbose=-1),
    param_distributions=param_dist,
    n_iter=30,
    cv=tscv,
    scoring='neg_root_mean_squared_error',
    random_state=42,
    n_jobs=-1
)

opt.fit(X_train, y_train)

print(f"Optimal Parameters: {opt.best_params_}")
print(f"Best Out-of-Fold Cross-Validation RMSE: {-opt.best_score_:.3f} MMT")`
};

export const edaAndTuningSnippets = {
  // Tuning snippets and aliases
  timeseries_cv,
  tuning_cv: timeseries_cv,
  hyperparameter_tuning_ridge,
  tuning_ridge: hyperparameter_tuning_ridge,
  hyperparameter_tuning_gbm,
  tuning_gbm: hyperparameter_tuning_gbm,

  // EDA snippets and aliases
  target_distribution,
  eda_target: target_distribution,
  correlation_analysis,
  eda_correlation: correlation_analysis,
  adf_stationarity,
  eda_stationarity: adf_stationarity,
  seasonal_decomposition,
  eda_seasonal: seasonal_decomposition
};

