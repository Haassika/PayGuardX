import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Transaction, TransactionStatus, DeviceType, LocationType, TimeContext, TransactionMetadata } from '../types';
import { generateUsers } from '../utils/mockData';
import { analyzeTransaction } from '../utils/fraudEngine';

// Define the scenarios
export type SimulationScenario = 'TRUSTED' | 'SUSPICIOUS' | 'BLOCK' | 'UNKNOWN';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  allTransactions: Transaction[];
  userTransactions: Transaction[];
  safeMode: boolean;
  incomingRequest: Transaction | null;
  unknownSenderCounts: Record<string, number>;
  simulationConfig: SimulationScenario;

  toggleSafeMode: () => void;
  setSimulationConfig: (config: SimulationScenario) => void;
  addTransaction: (transaction: Transaction) => void;
  resolveTransaction: (txId: string, approved: boolean) => void;
  login: (userId: string) => void;
  logout: () => void;
  triggerIncomingRequest: (transaction: Transaction) => void;
  registerUser: (name: string, phoneNumber: string, upiId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [safeMode, setSafeMode] = useState(true);

  // New: Global Simulation Configuration for Receiver
  const [simulationConfig, setSimulationConfig] = useState<SimulationScenario>('TRUSTED');

  const [incomingRequest, setIncomingRequest] = useState<Transaction | null>(null);
  const [unknownSenderCounts, setUnknownSenderCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedUsers = localStorage.getItem('payguardx_users');
    const storedTransactions = localStorage.getItem('payguardx_transactions');
    const storedUnknownCounts = localStorage.getItem('payguardx_unknownCounts');

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const generated = generateUsers(0);
      setUsers(generated);
      localStorage.setItem('payguardx_users', JSON.stringify(generated));
    }

    if (storedTransactions) {
      setAllTransactions(JSON.parse(storedTransactions));
    }

    if (storedUnknownCounts) {
      setUnknownSenderCounts(JSON.parse(storedUnknownCounts));
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('payguardx_users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    localStorage.setItem('payguardx_transactions', JSON.stringify(allTransactions));
  }, [allTransactions]);

  useEffect(() => {
    localStorage.setItem('payguardx_unknownCounts', JSON.stringify(unknownSenderCounts));
  }, [unknownSenderCounts]);

  const registerUser = (name: string, phoneNumber: string, upiId: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      phoneNumber,
      upiId,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      balance: 50000,
      isUnknown: false
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIncomingRequest(null);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const toggleSafeMode = () => setSafeMode(prev => !prev);

 const updateBalances = (t: Transaction) => {
  setUsers(prevUsers => {
    const currentSender = prevUsers.find(u => u.id === t.senderId);

    if (!currentSender || currentSender.balance < t.amount) {
      return prevUsers;
    }

    if (currentSender?.isUnknown && currentUser?.id === t.receiverId) {
      setUnknownSenderCounts(prev => ({
        ...prev,
        [currentSender.phoneNumber]: (prev[currentSender.phoneNumber] || 0) + 1
      }));
    }

    return prevUsers.map(user => {
      if (user.id === t.senderId)
        return { ...user, balance: Math.max(0, user.balance - t.amount) };

      if (user.id === t.receiverId)
        return { ...user, balance: user.balance + t.amount };

      return user;
    });
  });
};

  const addTransaction = async (originalTx: Transaction) => {
    // 1. Prevent Duplicates (shallow check before async call)
    if (allTransactions.some(t => t.id === originalTx.id)) return;

    let finalTx = { ...originalTx };

    // 2. Intercept Logic: If Receiver Safe Mode is ON, apply the Simulation Config Rules
    if (safeMode) {

      let newMetadata = { ...finalTx.metadata };
      let mlAmount = finalTx.amount;
      let overrideHappened = false;

      switch (simulationConfig) {
        case 'TRUSTED':
          newMetadata.deviceType = 'MOBILE';
          newMetadata.locationType = 'SAME_STATE';
          newMetadata.timeContext = 'DAY';
          mlAmount = finalTx.amount;
          overrideHappened = true;
          break;
        case 'SUSPICIOUS':
          newMetadata.deviceType = 'LAPTOP';
          newMetadata.locationType = 'DIFF_STATE';
          (newMetadata as any).timeContext = 'EVENING';
          mlAmount = finalTx.amount;
          overrideHappened = true;
          break;
        case 'BLOCK':
          newMetadata.deviceType = 'DESKTOP';
          newMetadata.locationType = 'DIFF_COUNTRY';
          newMetadata.timeContext = 'MIDNIGHT';
          mlAmount = finalTx.amount;
          overrideHappened = true;
          break;
        case 'UNKNOWN':
          newMetadata.deviceType = 'MOBILE';
          newMetadata.locationType = 'DIFF_STATE';
          (newMetadata as any).timeContext = 'NIGHT';
          mlAmount = finalTx.amount;
          overrideHappened = true;
          break;
      }

      // If we are overriding, we must re-evaluate the fraud score
      if (overrideHappened) {
        // IMPORTANT: UNKNOWN case also forces isUnknownSender to true
        const isSenderUnknown = simulationConfig === 'UNKNOWN' || users.find(u => u.id === finalTx.senderId)?.isUnknown;

        const fraudResult = await analyzeTransaction(mlAmount, newMetadata, {
          safeMode: true,
          isUnknownSender: !!isSenderUnknown,
          flow: 'RECEIVE',
          senderId: finalTx.senderId,
          receiverId: finalTx.receiverId
        });

        finalTx.metadata = {
          ...newMetadata,
          riskScore: fraudResult.riskScore,
          flagReason: fraudResult.reason,
          signals: (fraudResult as any).signals
        } as any;

        // Update Status based on ML result action
        if (fraudResult.action === 'APPROVE') {
          finalTx.status = TransactionStatus.PENDING;
        } else if (fraudResult.action === 'REJECT') {
          finalTx.status = TransactionStatus.BLOCKED;
        } else {
          finalTx.status = TransactionStatus.PENDING;
        }
      }
    } else {
      // Safe Mode OFF: Ensure Success
      finalTx.status = TransactionStatus.SUCCESS;
      finalTx.metadata.flagReason = "Safe Mode OFF: Auto-approved";
    }

    // Now safely update the state exactly once
    setAllTransactions(prev => {
      if (prev.some(t => t.id === finalTx.id)) return prev;

      // 3. Handle Balances if Success immediately
      

      // 4. Trigger Modal if Pending (and prevent duplicate triggers)
      if (finalTx.status === TransactionStatus.PENDING) {
        // Only trigger if I am the receiver
        if (currentUser && finalTx.receiverId === currentUser.id) {
          setTimeout(() => triggerIncomingRequest(finalTx), 0);
        }
      }

      return [finalTx, ...prev];
    });
  };

  const resolveTransaction = (txId: string, approved: boolean) => {
    if (incomingRequest && incomingRequest.id === txId) {
      setIncomingRequest(null);
    }

    setAllTransactions(prev => {
      const txIndex = prev.findIndex(item => item.id === txId);
      if (txIndex === -1) return prev;

      const tx = prev[txIndex];
      if (tx.status !== TransactionStatus.PENDING) return prev;

      const newStatus = approved ? TransactionStatus.SUCCESS : TransactionStatus.BLOCKED;
      const updatedTx = { ...tx, status: newStatus };

      if (approved) {
      updateBalances(updatedTx);
}
      const newAll = [...prev];
      newAll[txIndex] = updatedTx;
      return newAll;
    });
  };

  const triggerIncomingRequest = (t: Transaction) => {
    setIncomingRequest(t);
  };

  const userTransactions = allTransactions.filter(
    t => t.senderId === currentUser?.id || t.receiverId === currentUser?.id
  );

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      allTransactions,
      userTransactions,
      safeMode,
      simulationConfig,
      incomingRequest,
      unknownSenderCounts,
      toggleSafeMode,
      setSimulationConfig,
      addTransaction,
      resolveTransaction,
      login,
      logout,
      triggerIncomingRequest,
      registerUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};