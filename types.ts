export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  upiId: string;
  avatar: string;
  balance: number;
  isUnknown?: boolean;
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING', // Waiting for user review
  BLOCKED = 'BLOCKED', // Auto-rejected
}

export type DeviceType = 'MOBILE' | 'LAPTOP' | 'DESKTOP';
export type LocationType = 'SAME_STATE' | 'DIFF_STATE' | 'DIFF_COUNTRY';
export type TimeContext = 'DAY' | 'MIDNIGHT';

export interface TransactionMetadata {
  deviceType: DeviceType;
  locationType: LocationType;
  timeContext: TimeContext;
  typingSpeedCharsPerSec?: number; // kept for compatibility
  location?: { lat: number; lng: number } | null; // kept for compatibility
  device?: string; // kept for compatibility
  timestamp: number;
  riskScore: number;
  flagReason?: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  metadata: TransactionMetadata;
}

export interface FraudCheckResult {
  action: 'APPROVE' | 'REJECT' | 'FLAG';
  reason: string;
  riskScore: number;
}