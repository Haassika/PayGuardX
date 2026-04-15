import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic transaction data mimicking UPI fraud scenarios.
    Columns: TransactionID, Amount, SenderID, ReceiverID, Timestamp, DeviceID, Location, IsFraud
    """
    np.random.seed(42)
    random.seed(42)

    data = []
    start_time = datetime.now() - timedelta(days=30)

    sender_ids = [f"USER_{i:03d}" for i in range(1, 101)]
    receiver_ids = [f"MERCHANT_{i:03d}" for i in range(1, 51)] + [f"USER_{i:03d}" for i in range(101, 201)]
    device_ids = [f"DEV_{i:03d}" for i in range(1, 150)]
    locations = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"]

    for i in range(num_samples):
        txn_id = f"TXN_{i:06d}"
        
        # Determine if fraud (approx 5% fraud rate)
        is_fraud = 1 if random.random() < 0.05 else 0
        
        sender = random.choice(sender_ids)
        receiver = random.choice(receiver_ids)
        device = random.choice(device_ids)
        location = random.choice(locations)
        
        # Timestamp distribution
        if is_fraud:
            # Fraud often happens late night or rapid bursts
            if random.random() < 0.7:
                hour = random.randint(0, 5) # Late night
            else:
                hour = random.randint(6, 23)
        else:
            hour = random.randint(6, 23) # Normal hours
            
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        day_offset = random.randint(0, 29)
        timestamp = start_time + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)

        # Amount distribution
        if is_fraud:
            # Fraud: either very small (testing) or very large (draining)
            if random.random() < 0.5:
                amount = round(random.uniform(1.0, 100.0), 2)
            else:
                amount = round(random.uniform(5000.0, 50000.0), 2)
                
            # Fraud scenario: New device/location for user (simulated simple logic here)
            if random.random() < 0.8:
                device = f"DEV_NEW_{random.randint(1000,9999)}"
                location = random.choice(["Unknown_IP", "International_Proxy"])

        else:
            # Normal: varied amounts, usually smaller
            amount = round(random.uniform(10.0, 2000.0), 2)

        data.append([txn_id, amount, sender, receiver, timestamp, device, location, is_fraud])

    columns = ["TransactionID", "Amount", "SenderID", "ReceiverID", "Timestamp", "DeviceID", "Location", "IsFraud"]
    df = pd.DataFrame(data, columns=columns)
    return df

if __name__ == "__main__":
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(2000)
    output_file = "project_data.csv"
    df.to_csv(output_file, index=False)
    print(f"Dataset saved to {output_file}")
    print(df.head())
    print(f"Fraud distribution:\n{df['IsFraud'].value_counts()}")
