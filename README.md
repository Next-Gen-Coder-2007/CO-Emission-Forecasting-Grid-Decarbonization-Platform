# 🌍 U.S. Electric Power Sector CO₂ Emission Forecasting Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel_Serverless-black.svg?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An end-to-end, high-precision machine learning and deep learning forecasting platform for monthly carbon dioxide ($\text{CO}_2$) emissions from the United States electric power sector. Built on 510 months (1974–2016) of empirical historical data from the **U.S. Energy Information Administration (EIA)**.

The system features **8 predictive models** (classical ML + deep neural networks), a **7-stage feature engineering pipeline**, an interactive **Grid Scenario Simulator**, **Custom CSV Batch Inference**, **Scientific EDA Diagnostics**, and **Live Model Retraining** with dynamic hyperparameter tuning.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Dataset Provenance & Feature Engineering](#-dataset-provenance--feature-engineering)
- [Model Evaluation & Benchmark Leaderboard](#-model-evaluation--benchmark-leaderboard)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [Cloud Deployment (Vercel Serverless)](#-cloud-deployment-vercel-serverless)
- [REST API Reference](#-rest-api-reference)
- [Academic & Data Citations](#-academic--data-citations)

---

## 🚀 Key Features

- **8 Predictive Models**:
  - **Classical ML**: Ridge Regression ($L_2$ regularization), Support Vector Regression (SVR / RBF kernel), LightGBM (Gradient Boosting), and XGBoost.
  - **Deep Neural Networks**: Bidirectional LSTM, Stacked GRU, Hybrid CNN-LSTM (1D Convolution + BiLSTM), and Stacked BiGRU.
- **Modular Flask Blueprints**:
  - Organized application factory architecture with isolated blueprints: `general`, `models`, `dataset`, `inference`, and `simulations`.
- **Cloud Database Support**:
  - Dual-mode persistence: zero-config local SQLite with automated migrations, or cloud connection strings via `DATABASE_URL` (PostgreSQL, Neon, Supabase, Turso/libSQL).
- **Interactive Single-Page Application (SPA)**:
  - Built with React 19 and Tailwind CSS.
  - Interactive SVG timeseries forecasts with multi-model toggles.
  - Light theme Monaco Editor code inspection modal with background scroll-locking.
- **Scientific EDA Diagnostics**:
  - Fuel correlation heatmaps, target distribution histograms, monthly seasonality curves, and Autocorrelation Function (ACF) lag vectors.
- **Interactive Grid Scenario Simulator**:
  - Adjust fuel mixes (coal, natural gas, petroleum, renewables) in real time to simulate grid decarbonization policies and calculate instantaneous carbon intensity.
- **Custom CSV Testing & Batch Inference**:
  - Upload arbitrary time-series data or download pre-formatted holdout test files with 1 click to evaluate predictions and physical residuals.
- **Dynamic Retraining Engine**:
  - Tune learning rates, tree depths, and regularization coefficients directly in the UI with dynamic cross-validation.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend SPA (React 19 + Vite)"]
        UI[Tailwind CSS UI]
        Router[React Router DOM]
        Charts[Dynamic SVG & Diagnostic Charts]
        Monaco[Monaco Light Code Inspector]
        APIClient[Centralized API Client]
    end

    subgraph Gateway["Cloud Deployment & Routing"]
        Vercel[Vercel Serverless Router / vercel.json]
        Serverless[api/index.py WSGI Handler]
    end

    subgraph Backend["Modular Flask REST API"]
        Factory[create_app / app.py]
        BP_General[general_bp: /health, /overview]
        BP_Models[models_bp: /models, /predictions, /train]
        BP_Dataset[dataset_bp: /dataset, /eda]
        BP_Inference[inference_bp: /test-csv, /sample-csv]
        BP_Simulations[simulations_bp: /simulate, /simulations]
    end

    subgraph Storage["Data & Model Storage"]
        DB[(Cloud DB / SQLite)]
        Models[(Serialized .pkl & .keras Models)]
        EIA_CSV[(Preprocessed EIA Dataset)]
    end

    UI --> APIClient
    APIClient -->|Local Dev: :5000| Backend
    APIClient -->|Cloud: /api/*| Vercel
    Vercel --> Serverless
    Serverless --> Factory

    Factory --> BP_General
    Factory --> BP_Models
    Factory --> BP_Dataset
    Factory --> BP_Inference
    Factory --> BP_Simulations

    BP_General --> DB
    BP_Models --> Models
    BP_Models --> DB
    BP_Dataset --> EIA_CSV
    BP_Inference --> Models
    BP_Simulations --> DB
```

---

## 📂 Project Directory Structure

```
├── .env.example                     # Environment template with cloud DB variables
├── .gitignore                       # Unified gitignore (databases, env, python, node)
├── vercel.json                      # Single Vercel deployment configuration
├── requirements.txt                 # Backend Python production dependencies
├── main.ipynb                       # Scientific analysis and research notebook
│
├── api/
│   └── index.py                     # Vercel serverless WSGI entry point
│
├── backend/                         # Flask REST API Backend
│   ├── app.py                       # Application factory (create_app)
│   ├── config.py                    # Centralized path and environment configuration
│   ├── db.py                        # Database connection & migration engine
│   ├── models_cache.py              # In-memory model caching & reloader
│   ├── init_db.py                   # Automated database initializer
│   ├── train_engine.py              # Dynamic training and hyperparameter tuning engine
│   ├── requirements.txt             # Python backend dependencies
│   ├── blueprints/                  # Modular Flask Blueprints
│   │   ├── __init__.py              # Blueprint package exports
│   │   ├── general.py               # /api/health, /api/overview, /
│   │   ├── models.py                # /api/models, /api/predictions, /api/train
│   │   ├── dataset.py               # /api/dataset, /api/dataset/stats, /api/eda
│   │   ├── inference.py             # /api/test-csv, /api/sample-csv
│   │   └── simulations.py           # /api/simulate, /api/simulations
│   ├── models/                      # Serialized ML & DL model artifacts
│   │   ├── RidgeRegression.pkl      # Trained Ridge model
│   │   ├── LightGBM.pkl             # Trained LightGBM model
│   │   ├── XGBoost.pkl              # Trained XGBoost model
│   │   ├── SVM.pkl                  # Trained SVR model
│   │   ├── scaler_X.pkl             # Feature RobustScaler
│   │   ├── scaler_y.pkl             # Target MinMaxScaler
│   │   ├── feature_names.pkl        # List of 33 engineered features
│   │   ├── model_lstm.keras         # Trained BiLSTM weights
│   │   ├── model_gru.keras          # Trained GRU weights
│   │   ├── model_cnn_lstm.keras     # Trained CNN-LSTM weights
│   │   └── model_bigru.keras        # Trained BiGRU weights
│   ├── cleaned_monthly_sectoral_dataset.csv  # Raw cleaned historical EIA records
│   ├── preprocessed_co2_dataset.csv          # 33-feature engineered dataset (510 rows)
│   ├── sample_test_data.csv                  # Holdout test CSV for 1-click evaluation
│   ├── ml_results.csv                        # Classical ML evaluation metrics
│   ├── dl_results.csv                        # Deep Learning evaluation metrics
│   └── predictions_data.json                 # 510-month historical actuals and forecasts
│
└── frontend/                        # React 19 + Vite Single Page Application
    ├── package.json                 # Node dependencies and build scripts
    ├── vite.config.js               # Vite config with root envDir resolution
    ├── tailwind.config.js           # Tailwind CSS configuration
    ├── index.html                   # HTML5 shell with Google Inter font
    └── src/
        ├── App.jsx                  # SPA Router & global layout
        ├── main.jsx                 # React root mount point
        ├── index.css                # Tailwind base styles and design tokens
        ├── api/
        │   └── client.js            # Centralized API client with environment resolution
        ├── components/
        │   ├── Navbar.jsx           # Top navigation bar with live API status badge
        │   ├── Footer.jsx           # Global footer with EIA references
        │   ├── CodeModal.jsx        # Monaco Editor light theme inspection modal
        │   ├── TimeseriesChart.jsx  # Interactive SVG timeseries with model toggles
        │   ├── DiagnosticCharts.jsx # Parity, residual, and feature importance charts
        │   └── EdaCharts.jsx        # Heatmaps, seasonality, and ACF lag charts
        ├── data/
        │   └── codeSnippets.js      # Clean Python snippets for Monaco inspector
        └── pages/
            ├── DashboardPage.jsx        # Main dashboard with dataset provenance
            ├── EdaPage.jsx              # Statistical exploratory data analysis
            ├── DatasetExplorerPage.jsx  # 510-month paginated dataset explorer
            ├── ModelTrainingPage.jsx    # Live model retraining & hyperparameter tuning
            ├── EvaluationPage.jsx       # Benchmark evaluation breakdown & metrics
            ├── CsvTesterPage.jsx        # Custom CSV upload & holdout inference
            └── ScenarioSimulatorPage.jsx# Interactive grid dispatch simulator
```

---

## 📊 Dataset Provenance & Feature Engineering

### 1. Primary Data Source
- **Origin**: U.S. Energy Information Administration (EIA), *Monthly Energy Review (MER)*, Table 12.6 (*Carbon Dioxide Emissions From Energy Consumption: Electric Power Sector*).
- **Time Horizon**: February 1974 – July 2016 (**510 contiguous monthly observations**).
- **Target Variable**: `Total_CO2` (Total electric power sector emissions in **Million Metric Tons** of $\text{CO}_2$).

### 2. Feature Engineering Pipeline (33 Features)
Raw fuel generation volumes are transformed through a 7-stage pipeline:
1. **Primary Fuel Regressors**: Coal, Natural Gas, Petroleum, Distillate Fuel Oil, Residual Fuel Oil, Geothermal, Petroleum Coke, and Non-Biomass Waste.
2. **Cyclical Calendar Transforms**:
   $$\text{Month}_{\sin} = \sin\left(\frac{2\pi \cdot \text{Month}}{12}\right), \quad \text{Month}_{\cos} = \cos\left(\frac{2\pi \cdot \text{Month}}{12}\right)$$
3. **Autoregressive Lags**: Lags $t-1, t-2, t-3, t-12$ for the target variable to capture seasonal memory.
4. **Fuel-Specific Lags**: Lags $t-1$ for Coal, Natural Gas, and Petroleum.
5. **Rolling Aggregations**: 3, 6, and 12-month rolling means, standard deviations, and exponential moving averages ($\text{EMA}_3, \text{EMA}_6$).
6. **Sectoral Fuel Shares**: Relative generation proportions $\frac{\text{Fuel}}{\text{Total CO}_2 + \epsilon}$.
7. **First & Seasonal Differencing**:
   $$\Delta_1 = y_t - y_{t-1}, \quad \Delta_{12} = y_t - y_{t-12}$$

---

## 🏆 Model Evaluation & Benchmark Leaderboard

Models were evaluated on a chronological holdout test set using both normalized metrics and real physical metrics (Million Metric Tons):

| Rank | Model Architecture | Model Family | $R^2$ Score | Normalized RMSE | Real RMSE ($\text{MMT}$) | Real MAE ($\text{MMT}$) |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 🥇 | **Ridge Regression** ($\alpha=2.0$) | Classical ML | **0.9962** | **0.0102** | **1.59 MMT** | **1.09 MMT** |
| 🥈 | **Support Vector Regression (SVR)** | Classical ML | 0.9493 | 0.0372 | 5.81 MMT | 3.25 MMT |
| 🥉 | **XGBoost Regressor** | Tree Ensemble | 0.8621 | 0.0614 | 9.59 MMT | 7.52 MMT |
| 4 | **LightGBM Regressor** | Tree Ensemble | 0.8514 | 0.0638 | 9.96 MMT | 7.29 MMT |
| 5 | **Bidirectional LSTM** (64 units) | Deep Learning | 0.6663 | 0.0955 | 14.92 MMT | 12.00 MMT |
| 6 | **Stacked GRU** (64 units) | Deep Learning | 0.6463 | 0.0984 | 15.36 MMT | 12.54 MMT |
| 7 | **Conv1D + BiLSTM** | Hybrid DL | 0.5840 | 0.1120 | 17.49 MMT | 13.80 MMT |
| 8 | **Stacked BiGRU** | Deep Learning | 0.5620 | 0.1180 | 18.42 MMT | 14.50 MMT |

> **Key Machine Learning Insight**: Ridge Regression achieves near-perfect predictive accuracy ($R^2 = 0.9962$, $\text{RMSE} = 1.59\text{ MMT}$) because carbon emissions are governed by the **stoichiometric physical chemistry** of fuel combustion:
> $$\text{CO}_2 \approx \sum_{i} \beta_i \times \text{Fuel}_i$$
> Ridge Regression preserves the linear superposition of emissions, avoiding the high-sample overfitting of non-linear deep neural networks on small monthly sample sizes ($N=510$).

---

## 🛠 Getting Started & Local Setup

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **Package Manager**: `npm` or `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/co2-emission-prediction.git
cd co2-emission-prediction
```

### 2. Configure Environment
Copy the example environment template into the root `.env`:
```bash
cp .env.example .env
```

### 3. Backend Setup
Create a virtual environment and install backend dependencies:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

Initialize the database schema and load baseline data:
```bash
python backend/init_db.py
```

Launch the Flask REST API server:
```bash
python backend/app.py
```
The backend API is now running at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 4. Frontend Setup
In a separate terminal, navigate to the `frontend/` directory and install dependencies:
```bash
cd frontend
npm install
```

Launch the Vite development server:
```bash
npm run dev
```
The React frontend is now live at `http://localhost:5173`.

---

## ⚙️ Environment Configuration (`.env`)

A single, unified `.env` file at the root coordinates both the Python backend and the React Vite frontend:

| Variable | Default Value | Description |
|:---|:---|:---|
| `PORT` | `5000` | Port for the Flask backend REST server |
| `HOST` | `0.0.0.0` | Bind host address |
| `FLASK_DEBUG` | `False` | Enable Flask debug mode (`True` / `False`) |
| `CORS_ORIGINS` | `*` | Allowed CORS origins for REST API |
| `DATABASE_URL` | *(empty)* | **Cloud Database connection string** (e.g. `postgresql://user:pass@host/db`). When empty, defaults to local SQLite. |
| `DATABASE_PATH` | `backend/co2_forecast.db` | Local SQLite database file path (ignored in git) |
| `MODEL_DIR` | `backend/models` | Directory containing serialized `.pkl` and `.keras` models |
| `CSV_PATH` | `backend/preprocessed_co2_dataset.csv` | Path to the 33-feature preprocessed EIA dataset |
| `VITE_API_URL` | `http://localhost:5000` | Frontend backend API URL (resolved by Vite via `envDir: '../'`). In Vercel cloud deployment, leave empty for same-origin serverless routing. |

---

## ☁️ Cloud Deployment (Vercel Serverless)

The repository is configured for single-project unified deployment on **Vercel** via `vercel.json` and `api/index.py`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Steps to Deploy to Vercel:
1. Push your repository to GitHub.
2. Import the repository into the **Vercel Dashboard**.
3. Under **Environment Variables**, set:
   - `DATABASE_URL`: Your cloud database connection string (e.g. Neon, Supabase, Turso).
   - `VITE_API_URL`: Leave empty or set to `/api` (for same-origin serverless calls).
4. Click **Deploy**. Vercel will automatically compile the React frontend bundle and package `api/index.py` as a serverless Python WSGI handler.

---

## 📡 REST API Reference

All backend endpoints are organized into Flask Blueprints with the prefix `/api`:

| Method | Endpoint | Blueprint | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | `general` | API service metadata and endpoint directory |
| `GET` | `/api/health` | `general` | Service status, database connectivity, and loaded model count |
| `GET` | `/api/overview` | `general` | Summary metrics: sample count, date ranges, best ML/DL models |
| `GET` | `/api/models` | `models` | Model leaderboard with $R^2$, RMSE, MAE, and real MMT metrics |
| `GET` | `/api/predictions` | `models` | 510-month time series with actual values and 8-model forecasts |
| `GET` | `/api/real-evaluation`| `models` | Record-by-record holdout evaluation and residual breakdown |
| `POST`| `/api/train` | `models` | Trigger dynamic retraining with custom hyperparameters |
| `GET` | `/api/charts/data` | `models` | Parity plot, residual histogram, and feature importance data |
| `GET` | `/api/dataset` | `dataset` | Paginated 510-row dataset records with search filtering |
| `GET` | `/api/dataset/stats` | `dataset` | Descriptive min/max/mean statistics for sectoral fuels |
| `GET` | `/api/eda` | `dataset` | Correlation matrix, ACF lags, seasonality, and Winsorization data |
| `POST`| `/api/test-csv` | `inference` | Batch inference on uploaded CSV or JSON test records |
| `GET` | `/api/sample-csv` | `inference` | Download pre-formatted holdout test CSV for instant testing |
| `POST`| `/api/simulate` | `simulations` | Simulate grid dispatch scenario and compute carbon intensity |
| `GET` | `/api/simulations` | `simulations` | Retrieve recent saved scenario simulations |
| `DELETE`| `/api/simulations/<id>` | `simulations` | Remove a saved simulation record |

---

## 📚 Academic & Data Citations

1. **U.S. Energy Information Administration (EIA)**:
   - *Monthly Energy Review (MER)*, Table 12.6: Carbon Dioxide Emissions From Energy Consumption: Electric Power Sector.
   - [Official Data Release](https://www.eia.gov/totalenergy/data/monthly/)
2. **Project Coursework**:
   - Course: *Mathematics for Computing - 2* (MFC-2)
   - Academic Term: Semester 2
   - Focus: Applied Multivariate Statistical Analysis, Time-Series Forecasting, and Mathematical Regularization ($L_1 / L_2$).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
