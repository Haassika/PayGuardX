

import streamlit as st
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, time
import plotly.graph_objects as go
import plotly.express as px

# Set page config
st.set_page_config(
    page_title="PayGuardX - Fraud Detection System",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load Models (Cached)
@st.cache_resource
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

# --- Custom CSS for Styling ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }
    
    /* Main Background */
    .stApp {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #ffffff;
        border-right: 1px solid #e0e0e0;
    }
    
    /* Headings */
    h1, h2, h3 {
        color: #0d1b2a;
        font-weight: 700;
    }
    
    /* Metric Cards */
    .metric-card {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        transition: transform 0.3s ease;
        text-align: center;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.2);
    }
    
    /* Buttons */
    .stButton>button {
        width: 100%;
        background: linear-gradient(90deg, #00b4db 0%, #0083b0 100%);
        color: white;
        border-radius: 12px;
        height: 55px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        box-shadow: 0 4px 15px rgba(0, 180, 219, 0.3);
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: scale(1.02);
        box-shadow: 0 6px 20px rgba(0, 180, 219, 0.4);
    }
    
    /* Hero Section Specifics */
    .hero-container {
        text-align: center;
        padding: 80px 20px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        color: white;
        border-radius: 20px;
        margin-bottom: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .hero-title {
        font-size: 4em;
        font-weight: 800;
        margin-bottom: 10px;
        background: linear-gradient(to right, #ffffff, #a8c0ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .hero-tagline {
        font-size: 1.5em;
        font-weight: 300;
        opacity: 0.9;
        margin-bottom: 30px;
    }
    
    .feature-card {
        background: white;
        padding: 20px;
        border-radius: 15px;
        text-align: center;
        height: 100%;
        box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }
    
</style>
""", unsafe_allow_html=True)

# --- Navigation State ---
if 'page' not in st.session_state:
    st.session_state['page'] = 'home'

def navigate_to(page):
    st.session_state['page'] = page
    st.rerun()


# --- Heuristic Rule Engine ---
# --- Heuristic Rule Engine ---
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

# --- Utils ---
def robust_transform(encoder, value, unknown_value=-1):
    try:
        return encoder.transform([value])[0]
    except ValueError:
        return unknown_value

# --- Main Interface ---
# --- Pages ---

def landing_page():
    # Navbar placeholder (visual only)
    st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
        <h3 style="margin:0; color: #1e3c72;">🛡️ PayGuardX</h3>
        <span style="color: #666;">Secure. Intelligent. Fast.</span>
    </div>
    """, unsafe_allow_html=True)

    # Hero Section
    st.markdown("""
    <div class="hero-container">
        <div class="hero-title">PayGuardX</div>
        <div class="hero-tagline">Rise Aware Secure Machine Engine</div>
        <p style="font-size: 1.2em; max-width: 600px; margin: 0 auto 30px auto; color: #e0e0e0;">
            Next-generation fraud detection powered by XGBoost and Isolation Forest. 
            Real-time risk scoring, explainable AI, and interactive simulation for safer digital payments.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        if st.button("🚀 Check Transaction Now"):
            navigate_to('dashboard')
            
    # Features Section
    st.markdown("<br><br>", unsafe_allow_html=True)
    f1, f2, f3 = st.columns(3)
    
    with f1:
        st.markdown("""
        <div class="feature-card">
            <h1 style="margin:0">🧠</h1>
            <h3>AI Powered</h3>
            <p>Hybrid logic using XGBoost Supervised Learning and Unsupervised Anomaly Detection.</p>
        </div>
        """, unsafe_allow_html=True)
        
    with f2:
        st.markdown("""
        <div class="feature-card">
            <h1 style="margin:0">⚡</h1>
            <h3>Real-Time</h3>
            <p>Instant risk scoring and rule-based blocking for immediate threat mitigation.</p>
        </div>
        """, unsafe_allow_html=True)
        
    with f3:
        st.markdown("""
        <div class="feature-card">
            <h1 style="margin:0">📊</h1>
            <h3>Explainable</h3>
            <p>Transparent insights into why a transaction was flagged, with visual risk breakdowns.</p>
        </div>
        """, unsafe_allow_html=True)


def dashboard():
    if iso_forest is None or xgb_model is None:
        st.error("Models not found! Please run 'model_trainer.py' to generate models.")
        if xgb_model is None:
             st.warning("XGBoost model (models/xgb_model.pkl) is missing. Please retrain.")
        return
        
    # Navigation Back
    if st.sidebar.button("← Back to Home"):
        navigate_to('home')

    # Sidebar - Input
    st.sidebar.image("https://img.icons8.com/color/96/shield.png", width=80)
    st.sidebar.title("PayGuardX Config")
    st.sidebar.markdown("---")
    
    st.sidebar.subheader("Transaction Details")
    # Using text_input to allow new values
    sender_id = st.sidebar.text_input("Sender ID", value="USER_001", help="Enter Sender ID (e.g., USER_001)")
    receiver_id = st.sidebar.text_input("Receiver ID", value="MERCHANT_001", help="Enter Receiver ID")
    amount = st.sidebar.number_input("Amount (₹)", min_value=0.0, value=500.0, step=10.0)
    
    st.sidebar.subheader("Context")
    txn_time = st.sidebar.time_input("Time of Transaction", value=datetime.now().time())
    
    # Device & Location
    device_id = st.sidebar.text_input("Device ID", value="DEV_001", help="Enter Device ID")
    location = st.sidebar.text_input("Location", value="Mumbai", help="Enter City or IP Region")

    # What-If Simulator
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔬 What-If Simulator")
    sim_amount = st.sidebar.slider("Simulate Amount", 0, 50000, int(amount), 100)
    sim_hour = st.sidebar.slider("Simulate Hour", 0, 23, txn_time.hour)
    sim_new_device = st.sidebar.checkbox("Simulate New Device", value=False)
    sim_risky_loc = st.sidebar.checkbox("Simulate Risky Location", value=False)
    
    
    # Analyze Button in Sidebar
    analyze_pressed = st.sidebar.button("🛡️ Analyze Transaction")

    # Main Analysis Logic
    # We want to run analysis either if button is pressed or if we are already in analysis mode (could persist, but for now simple)
    # Actually, let's auto-run or run on button. Button is better for "Simulation" feel.
    
    if analyze_pressed:
        run_analysis(sender_id, receiver_id, amount, txn_time, device_id, location, 
                     override_amount=sim_amount if sim_amount != amount else None,
                     override_hour=sim_hour if sim_hour != txn_time.hour else None,
                     override_new_device=sim_new_device,
                     override_risky_loc=sim_risky_loc)
    else:
        # Default view or empty state
        st.info("👈 Use the sidebar to configure transaction details and click 'Analyze Transaction'.")
        
        # Show a placeholder graphic or stats
        st.markdown("### 📡 System Ready")
        st.markdown("Enter transaction details to detect fraud probability.")

def run_analysis(sender_id, receiver_id, amount, txn_time, device_id, location, 
                 override_amount=None, override_hour=None, override_new_device=False, override_risky_loc=False):
    
    # Apply simulation overrides
    viz_amount = override_amount if override_amount is not None else amount
    viz_hour = override_hour if override_hour is not None else txn_time.hour
    
    # 1. Feature Prep
    hour = viz_hour
    day_of_week = datetime.now().weekday()
    
    # Handle unknown categories for ML
    s_enc = robust_transform(le_sender, sender_id, -1)
    r_enc = robust_transform(le_receiver, receiver_id, -1)
    d_enc = robust_transform(le_device, device_id, -1)
    l_enc = robust_transform(le_location, location, -1)
    
    # Detect New/Unseen Entities
    is_new_sender = (s_enc == -1)
    is_new_receiver = (r_enc == -1)
    is_new_device = (d_enc == -1) or override_new_device
    is_new_location = (l_enc == -1)
    
    # Input vector [Amount, Hour, DayOfWeek, Sender, Receiver, Device, Location]
    # Note: If -1 (unknown), it might outlier in ML, which is good for anomaly detection
    features = np.array([[viz_amount, hour, day_of_week, s_enc, r_enc, d_enc, l_enc]])
    
    # Scale
    features_scaled = scaler.transform(features)
    
    # 2. ML Prediction
    # Isolation Forest (Anomaly Score) - Returns 1 for inlier, -1 for outlier/anomaly
    anomaly_pred = iso_forest.predict(features_scaled)[0]
    anomaly_score = iso_forest.score_samples(features_scaled)[0] # Low score = anomaly
    
    # XGBoost (Fraud Prob)
    fraud_prob = xgb_model.predict_proba(features_scaled)[0][1] # Probability of Class 1 (Fraud)
    
    # 3. Rule Engine
    # Pass simulated location if any
    check_loc = "Unknown_IP" if override_risky_loc else location
    rules_hit, rule_score_boost = check_rules(viz_amount, hour, is_new_device, is_new_receiver, check_loc)
    
    # 4. Final Risk Calculation
    # Normalize ML outputs to 0-100 scale
    # Anomaly score is roughly -0.5 to 0.5. Lower is worse.
    # Map anomaly score to 0-40 component
    ml_anomaly_risk = max(0, min(40, (0.0 - anomaly_score) * 100)) # Simple heuristic mapping
    
    ml_rf_risk = fraud_prob * 100 # 0-100
    
    # Hybrid Score: 40% XGBoost + 20% IsoForest + 40% Rules (capped at 100)
    base_risk = (ml_rf_risk * 0.4) + (ml_anomaly_risk * 0.2) + rule_score_boost
    final_risk_score = min(100, round(base_risk))
    
    # Risk-Based Action Logic
    action_color = "#28a745" # Green
    action_text = "🟢 Allow Transaction (Simulated)"
    action_desc = "Transaction looks safe to proceed."
    
    if final_risk_score >= 75:
        action_color = "#dc3545" # Red
        action_text = "🔴 Block Transaction (Simulated)"
        action_desc = "High risk detected. Immediate block recommended."
    elif final_risk_score >= 40:
        action_color = "#ffc107" # Orange
        action_text = "🟠 Trigger OTP Verification (Simulated)"
        action_desc = "Moderate risk. Additional verification required."
    
    # --- Display Results ---
    st.title("🛡️ Transaction Risk Analysis")
    
    # Header Metrics
    col1, col2, col3 = st.columns(3)
    
    risk_color = "#008000" # Green
    risk_label = "LOW RISK"
    if final_risk_score > 75:
        risk_color = "#ff2b2b" # Red
        risk_label = "CRITICAL RISK"
    elif final_risk_score > 40:
        risk_color = "#ffa500" # Orange
        risk_label = "MODERATE RISK"
        
    with col1:
        st.markdown(f"""
        <div class="metric-card" style="border-left: 5px solid {risk_color}">
            <h3 style="margin:0">Risk Score</h3>
            <h1 style="color:{risk_color}; font-size: 3em; margin:0">{final_risk_score}/100</h1>
            <p style="color:{risk_color}; font-weight:bold">{risk_label}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Recommended Action Card
        st.markdown(f"""
        <div style="background-color: {action_color}; padding: 15px; border-radius: 10px; color: white; text-align: center; margin-top: 10px;">
            <h3 style="margin:0">{action_text}</h3>
            <p style="margin:0">{action_desc}</p>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <h3 style="margin:0">Fraud Probability</h3>
            <h2 style="margin:10px 0">{fraud_prob:.1%}</h2>
            <p>(XGBoost Model)</p>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        anom_text = "Anomaly Detected" if anomaly_pred == -1 else "Normal Pattern"
        anom_color = "red" if anomaly_pred == -1 else "green"
        st.markdown(f"""
        <div class="metric-card">
            <h3 style="margin:0">Behavior Analysis</h3>
            <h2 style="color:{anom_color}; margin:10px 0">{anom_text}</h2>
            <p>(Isolation Forest)</p>
        </div>
        """, unsafe_allow_html=True)

    # Breakdown & visual
    st.markdown("---")
    
    c1, c2 = st.columns([2, 1])
    
    with c1:
        st.subheader("📊 Explanability Dashboard")
        
        # Reasons
        if len(rules_hit) > 0:
            st.error("🚩 **Rule Violations Detected:**")
            for rule in rules_hit:
                st.markdown(f"- {rule}")
        else:
            st.success("✅ No specific rule violations detected.")
            
        # Feature Importance (Proxy visualization)
        factors = {
            "Transaction Amount": viz_amount / 50000 * 100, # Normalized rough scale
            "Time Risk": rule_score_boost if "Late" in str(rules_hit) else 0,
            "Device Risk": 80 if is_new_device else 0,
            "Location Risk": 90 if check_loc in ["Unknown_IP", "International_Proxy"] or is_new_location else 0,
            "ML Model Signal (XGB)": ml_rf_risk
        }
        
        # Cleanup zero values for chart
        plot_data = {k: v for k, v in factors.items() if v > 0}
        
        if plot_data:
            fig = px.bar(
                x=list(plot_data.values()), 
                y=list(plot_data.keys()), 
                orientation='h',
                title="Top Risk Contributors",
                labels={'x': 'Risk Contribution (%)', 'y': 'Factor'},
                color=list(plot_data.values()),
                color_continuous_scale='Reds'
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Transaction appears normal with no significant risk factors.")

    with c2:
        st.subheader("Transaction Summary")
        details = {
            "ID": "TXN_LIVE_001",
            "Sender": sender_id,
            "Receiver": receiver_id,
            "Time": f"{hour:02d}:{txn_time.minute:02d}",
            "Location": location + (" (New)" if is_new_location else ""),
            "Device": device_id + (" (New)" if is_new_device else "")
        }
        st.table(details)


def main():
    if st.session_state['page'] == 'home':
        landing_page()
    else:
        dashboard()

if __name__ == "__main__":
    main()
