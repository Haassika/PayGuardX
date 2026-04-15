import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import IsolationForest
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.metrics import confusion_matrix, accuracy_score
import joblib
import os

# Create models directory if not exists
if not os.path.exists("models"):
    os.makedirs("models")

def train_models():
    print("Loading data...")
    # Try loading the generated data
    try:
        df = pd.read_csv("project_data.csv")
    except FileNotFoundError:
        print("Error: 'project_data.csv' not found. Please run data_generator.py first.")
        return

    print("Data loaded. performing feature engineering...")

    # Feature Engineering
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df['Hour'] = df['Timestamp'].dt.hour
    df['DayOfWeek'] = df['Timestamp'].dt.dayofweek
    
    # Encode categorical variables
    le_sender = LabelEncoder()
    df['SenderID_Encoded'] = le_sender.fit_transform(df['SenderID'])
    
    le_receiver = LabelEncoder()
    df['ReceiverID_Encoded'] = le_receiver.fit_transform(df['ReceiverID'])
    
    le_device = LabelEncoder()
    df['DeviceID_Encoded'] = le_device.fit_transform(df['DeviceID'])
    
    le_location = LabelEncoder()
    df['Location_Encoded'] = le_location.fit_transform(df['Location'])

    # Standardize numerical features
    scaler = StandardScaler()
    numerical_features = ['Amount', 'Hour', 'DayOfWeek', 'SenderID_Encoded', 'ReceiverID_Encoded', 'DeviceID_Encoded', 'Location_Encoded']
    X = df[numerical_features]
    y = df['IsFraud']
    
    X_scaled = scaler.fit_transform(X)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # 1. Isolation Forest (Unsupervised Anomaly Detection)
    print("Training Isolation Forest...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X_train)
    
    # 2. XGBoost (Supervised Fraud Detection)
    print("Training XGBoost with Hyperparameter Tuning...")
    
    # Calculate scale_pos_weight for class imbalance
    # scale_pos_weight = total_negative_examples / total_positive_examples
    pos_counts = y_train.sum()
    neg_counts = len(y_train) - pos_counts
    scale_pos_weight = neg_counts / pos_counts if pos_counts > 0 else 1
    
    xgb_model = XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        scale_pos_weight=scale_pos_weight,
        use_label_encoder=False,
        random_state=42
    )
    
    # Hyperparameter Tuning
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2]
    }
    
    grid_search = GridSearchCV(estimator=xgb_model, param_grid=param_grid, cv=3, scoring='f1', n_jobs=-1, verbose=1)
    grid_search.fit(X_train, y_train)
    
    best_xgb_model = grid_search.best_estimator_
    print(f"Best Hyperparameters: {grid_search.best_params_}")

    # Evaluate XGBoost
    y_pred = best_xgb_model.predict(X_test)
    print("\nXGBoost Performance:")
    print(classification_report(y_test, y_pred))

    print("\nAccuracy:", accuracy_score(y_test, y_pred))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    # Save models and encoders
    print("Saving models and encoders...")
    joblib.dump(iso_forest, "models/iso_forest.pkl")
    joblib.dump(best_xgb_model, "models/xgb_model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    joblib.dump(le_sender, "models/le_sender.pkl")
    joblib.dump(le_receiver, "models/le_receiver.pkl")
    joblib.dump(le_device, "models/le_device.pkl")
    joblib.dump(le_location, "models/le_location.pkl")
    
    print("Training complete. Models saved in 'models/' directory.")

if __name__ == "__main__":
    train_models()
