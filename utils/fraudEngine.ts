import { TransactionMetadata, FraudCheckResult } from '../types';

interface FraudConfig {
  safeMode: boolean;
  isUnknownSender: boolean;
  flow: 'SEND' | 'RECEIVE';
  senderId?: string;
  receiverId?: string;
}

export const analyzeTransaction = async (
  amount: number,
  metadata: TransactionMetadata,
  config: FraudConfig
): Promise<FraudCheckResult> => {
  try {
    const device = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

    const response = await fetch('http://localhost:5000/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        metadata,
        config,
        device,
        senderId: config.senderId,
        receiverId: config.receiverId
      }),
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as FraudCheckResult;
  } catch (error) {
     console.error("Fraud Check API failed, falling back to safe defaults", error);
     // Fallback to safe mode behavior if API fails so the UI doesn't crash completely
     if (!config.safeMode) {
      return {
        action: 'APPROVE',
        reason: 'RISK LEVEL: 0% (SAFE)\nSafe Mode is disabled.',
        riskScore: 0,
      };
     }
     return {
        action: 'FLAG',
        reason: 'RISK LEVEL: 50% (MODERATE)\nFallback: API Unavailable (Did you start api.py?)',
        riskScore: 50,
      };
  }
};