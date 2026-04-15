# PayGuardX – Fraud Detection System

## Overview

PayGuardX is a real-time fraud detection system designed to improve the security of digital payment transactions. It analyzes each transaction using machine learning models and rule-based logic to identify suspicious activities and prevent fraud.

---

## Features

* Real-time transaction analysis
* Fraud detection using hybrid ML model
* Risk score generation for each transaction
* Device, location, and time-based analysis
* Smart alerts for risky transactions
* User-friendly dashboard

---

## Methodology

The system follows these steps:

1. Data is collected and preprocessed
2. Features like amount, time, device, and location are extracted
3. Two models are used:

   * XGBoost (for detecting known fraud patterns)
   * Isolation Forest (for detecting anomalies)
4. Risk score is calculated using:

   * ML outputs
   * Rule-based conditions
   * Context (device, location, time)
5. Final decision:

   * Low risk → Approve
   * Medium risk → Flag
   * High risk → Reject

---

## Tech Stack

Frontend:

* React (TypeScript)
* Tailwind CSS

Backend:

* Flask (Python)

Machine Learning:

* XGBoost
* Isolation Forest
* Scikit-learn

---

## How to Run

### Backend

```bash
python api.py
```

### Frontend

```bash
npm install
npm run dev
```

### Model Training

```bash
python model_trainer.py
```

---

## Project Flow

User → Frontend → API → ML Models → Risk Score → Decision → UI

---

## Future Improvements

* Real-time geolocation tracking
* Advanced deep learning models
* Better user behavior analysis

---

## Author

Haassika Gampa

---


