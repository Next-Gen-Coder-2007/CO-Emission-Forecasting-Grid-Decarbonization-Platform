import os
import joblib
from config import MODEL_DIR

scaler_X = None
scaler_y = None
feature_names = None
models_dict = {}

def load_trained_models():
    """Load trained models, scalers, and metadata once into memory for fast real-time inference"""
    global scaler_X, scaler_y, feature_names, models_dict
    try:
        sx_path = os.path.join(MODEL_DIR, "scaler_X.pkl")
        if os.path.exists(sx_path):
            scaler_X = joblib.load(sx_path)
            scaler_y = joblib.load(os.path.join(MODEL_DIR, "scaler_y.pkl"))
            feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
            
            for m_name, file_name in [
                ('Ridge Regression', 'RidgeRegression.pkl'),
                ('LightGBM', 'LightGBM.pkl'),
                ('XGBoost', 'XGBoost.pkl'),
                ('SVM', 'SVM.pkl')
            ]:
                p = os.path.join(MODEL_DIR, file_name)
                if os.path.exists(p):
                    models_dict[m_name] = joblib.load(p)
            print(f"Loaded {len(models_dict)} trained models and scalers into memory successfully.")
    except Exception as e:
        print(f"Warning during model loading: {e}")

def get_loaded_models():
    return models_dict

def get_scalers():
    return scaler_X, scaler_y, feature_names

def reload_model(model_name, file_name):
    global models_dict
    m_path = os.path.join(MODEL_DIR, file_name)
    if os.path.exists(m_path):
        models_dict[model_name] = joblib.load(m_path)
