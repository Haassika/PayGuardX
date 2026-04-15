import joblib
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load Models
def load_models():
    try:
        iso_forest = joblib.load("models/iso_forest.pkl")
        try:
            xgb_model = joblib.load("models/xgb_model.pkl")
        except FileNotFoundError:
            xgb_model = None
        
        scaler = joblib.load("models/scaler.pkl")
        le_sender = joblib.load("models/le_sender.pkl")
        le_receiver = joblib.load("models/le_receiver.pkl")
        le_device = joblib.load("models/le_device.pkl")
        le_location = joblib.load("models/le_location.pkl")
        return iso_forest, xgb_model, scaler, le_sender, le_receiver, le_device, le_location
    except FileNotFoundError:
        return None, None, None, None, None, None, None

iso_forest, xgb_model, scaler, le_sender, le_receiver, le_device, le_location = load_models()

def robust_transform(encoder, value, unknown_value=-1):
    try:
        return encoder.transform([value])[0]
    except ValueError:
        return unknown_value

def check_rules(amount, hour, is_new_device, is_new_receiver, location):
    rules_triggered = []
    risk_score_boost = 0
    
    # Rule 1: Late Night Burst (00:00 - 05:00)
    if 0 <= hour <= 5:
        rules_triggered.append("Late Night Transaction (00:00-05:00)")
        risk_score_boost += 20

    # Rule 2: High Amount
    if amount > 10000:
        rules_triggered.append("High Transaction Amount (> ₹10,000)")
        risk_score_boost += 15
        
    # Rule 3: Unknown Device (New Logic)
    if is_new_device:
        rules_triggered.append("New/Unseen Device Detected")
        risk_score_boost += 25
        
    # Rule 4: Suspicious Location
    if location in ["Unknown_IP", "International_Proxy"]:
        rules_triggered.append("High-Risk Location Detected")
        risk_score_boost += 30

    # Rule 5: New Receiver (potential Mule)
    if is_new_receiver and amount > 5000:
        rules_triggered.append("High Amount to New Receiver")
        risk_score_boost += 10

    return rules_triggered, risk_score_boost

@app.route('/api/predict', methods=['POST'])
def predict():
    if iso_forest is None or xgb_model is None:
        return jsonify({"error": "Models not loaded. Please run model_trainer.py first."}), 500

    data = request.json
    
    amount = float(data.get('amount', 0))
    metadata = data.get('metadata', {})
    config = data.get('config', {})
    
    device_type = metadata.get('deviceType', 'MOBILE')
    location_type = metadata.get('locationType', 'SAME_STATE')
    time_context = metadata.get('timeContext', 'DAY')
    
    safe_mode = config.get('safeMode', True)
    is_unknown_sender = config.get('isUnknownSender', False)
    flow = config.get('flow', 'SEND')
    sender_id = data.get('senderId', 'UNKNOWN')
    receiver_id = data.get('receiverId', 'UNKNOWN')

    if not safe_mode:
        return jsonify({
            "action": "APPROVE",
            "riskScore": 0,
            "reason": "RISK LEVEL: 0% (SAFE)\nSafe Mode is disabled. All transactions allowed."
        })
        
    device = data.get("device", "unknown")
    device_str = device.lower()
    
    if device != "unknown":
        if 'mobi' in device_str or 'android' in device_str or 'iphone' in device_str:
            device_type = 'MOBILE'
        elif 'windows' in device_str or 'macintosh' in device_str or 'linux' in device_str:
            device_type = 'DESKTOP'
        else:
            device_type = 'LAPTOP'
    else:
        device_type = metadata.get('deviceType', 'MOBILE')

    device_id = "DEV_001" if device_type == "MOBILE" else "UNKNOWN_DEVICE"
    if device_type == "DESKTOP": device_id = "NEW_DESKTOP"
    
    remote_ip = request.remote_addr or "unknown"
    if remote_ip != "unknown":
        location = remote_ip
        # Keep existing UI logic happy if possible
        location_type = "SAME_STATE" if remote_ip in ["127.0.0.1", "::1"] else "DIFF_STATE"
    else:
        location_type = metadata.get('locationType', 'SAME_STATE')
        location = "Mumbai" if location_type == "SAME_STATE" else "Delhi"
        if location_type == "DIFF_COUNTRY": location = "International_Proxy"
    
    from datetime import datetime
    import pytz

    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)

    hour = current_time.hour
    day_of_week = current_time.weekday()
    print("Current IST Hour:", hour)
    if 0 <= hour < 6:
        time_context = "MIDNIGHT"
    elif 6 <= hour < 18:
        time_context = "DAY"
    else:
        time_context = "EVENING"
    
    s_enc = robust_transform(le_sender, sender_id, -1)
    r_enc = robust_transform(le_receiver, receiver_id, -1)
    d_enc = robust_transform(le_device, device_id, -1)
    l_enc = robust_transform(le_location, location, -1)
    
    is_new_sender = (s_enc == -1)
    is_new_receiver = (r_enc == -1)
    is_new_device = (d_enc == -1) or device_type != "MOBILE"
    is_new_location = (l_enc == -1) or location_type != "SAME_STATE"
    
    features = np.array([[amount, hour, day_of_week, s_enc, r_enc, d_enc, l_enc]])
    features_scaled = scaler.transform(features)
    
    anomaly_pred = iso_forest.predict(features_scaled)[0]
    anomaly_score = iso_forest.score_samples(features_scaled)[0]
    fraud_prob = xgb_model.predict_proba(features_scaled)[0][1]
    
    rules_hit, rule_score_boost = check_rules(amount, hour, is_new_device, is_new_receiver, location)
    
    ml_anomaly_risk = max(0, min(40, (0.0 - anomaly_score) * 100))
    ml_rf_risk = fraud_prob * 100
    
    base_risk = (ml_rf_risk * 0.4) + (ml_anomaly_risk * 0.2) + rule_score_boost
    
    # Apply context options as modifiers to the ML score instead of overrides
    is_unknown_scenario = (flow == 'RECEIVE' and is_unknown_sender)
    is_high_risk = (location_type == 'DIFF_COUNTRY' or (device_type == 'DESKTOP' and time_context == 'MIDNIGHT'))
    is_suspicious = (device_type == 'LAPTOP' or location_type == 'DIFF_STATE')
    is_trusted = (device_type == 'MOBILE' and location_type == 'SAME_STATE' and not is_unknown_scenario)

    if is_high_risk:
        base_risk += 45
        rules_hit.append("High-Risk Context (+Score)")
    elif is_suspicious and not is_unknown_scenario:
        base_risk += 35
        rules_hit.append("Suspicious Context (+Score)")
    elif is_trusted:
        base_risk -= 20
        rules_hit.append("Trusted Context (-Score)")

    if is_unknown_scenario:
        rules_hit.append("Unknown Sender (Score Unchanged)")

    final_risk_score = min(100, max(0, round(float(base_risk))))
    
    # Final decision threshold system
    if final_risk_score >= 75:
        action = "REJECT"
        reason = f"RISK LEVEL: {final_risk_score}% (CRITICAL)\nCause: " + ", ".join(rules_hit)
    elif final_risk_score >= 40:
        action = "FLAG"
        reason = f"RISK LEVEL: {final_risk_score}% (REVIEW/VERIFICATION)\nCause: " + ", ".join(rules_hit)
    else:
        action = "APPROVE"
        reason = f"RISK LEVEL: {final_risk_score}% (SAFE)\nCause: " + (", ".join(rules_hit) if rules_hit else "Standard transaction.")

    signals = {
        "device": {
            "value": "Trusted Mobile" if device_type == "MOBILE" else ("Unusual Device" if device_type == "LAPTOP" else "High Risk Device"),
            "description": f"Login attempt from a {device_type.capitalize()} device.",
            "score": 95 if device_type == "MOBILE" else (45 if device_type == "LAPTOP" else 20),
            "status": "VERIFIED" if device_type == "MOBILE" else ("WARNING" if device_type == "LAPTOP" else "CRITICAL")
        },
        "location": {
            "value": "Home Region" if location_type == "SAME_STATE" else ("Domestic Roaming" if location_type == "DIFF_STATE" else "Foreign IP"),
            "description": "Transaction originates from your registered state." if location_type == "SAME_STATE" else ("Detected location in a different state." if location_type == "DIFF_STATE" else "IP Address traces to an international location."),
            "score": 98 if location_type == "SAME_STATE" else (60 if location_type == "DIFF_STATE" else 10),
            "status": "SAFE" if location_type == "SAME_STATE" else ("FLAGGED" if location_type == "DIFF_STATE" else "DANGER")
        },
        "time": {
            "value": "Standard Hours" if time_context in ["DAY", "EVENING"] else "Unusual Hours",
            "description": "Activity aligns with your usual usage patterns." if time_context in ["DAY", "EVENING"] else "Transaction initiated after midnight.",
            "score": 100 if time_context in ["DAY", "EVENING"] else 40,
            "status": "NORMAL" if time_context in ["DAY", "EVENING"] else "ANOMALY"
        }
    }

    return jsonify({
        "action": action,
        "riskScore": final_risk_score,
        "reason": reason,
        "signals": signals
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
