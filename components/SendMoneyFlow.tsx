import React, { useState, useEffect } from 'react';
import { User, TransactionStatus, FraudCheckResult, DeviceType, LocationType, TimeContext } from '../types';
import { useApp } from '../context/AppContext';
import { analyzeTransaction } from '../utils/fraudEngine';
import { ArrowLeft, Search, Loader2, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Settings2 } from 'lucide-react';

interface SendMoneyFlowProps {
    onBack: () => void;
    onComplete: () => void;
}

export const SendMoneyFlow: React.FC<SendMoneyFlowProps> = ({ onBack, onComplete }) => {
    const { users, currentUser, addTransaction, safeMode } = useApp();

    const [step, setStep] = useState<'SELECT_USER' | 'ENTER_AMOUNT' | 'REVIEW' | 'RESULT'>('SELECT_USER');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [amount, setAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.PENDING);
    const [processing, setProcessing] = useState(false);

    // --- DEMO CONFIGURATION STATE ---
    const [showDemoConfig, setShowDemoConfig] = useState(false);
    const [demoDevice, setDemoDevice] = useState<DeviceType>('MOBILE');
    const [demoLocation, setDemoLocation] = useState<LocationType>('SAME_STATE');
    const [demoTime, setDemoTime] = useState<TimeContext>('DAY');

    // Filter Users (Exclude current and unknown for sending list usually, but allow all here)
    const filteredUsers = users.filter(u =>
        u.id !== currentUser?.id && !u.isUnknown &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.upiId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phoneNumber.includes(searchQuery))
    );

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;
        setAmount(val);
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setStep('ENTER_AMOUNT');
        setAmount('');
    };

    const initiateTransaction = async () => {
        if (!amount || !selectedUser) return;
        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;

        // Balance Check
        if (currentUser && parsedAmount > (currentUser.balance || 0)) {
            setFraudResult({
                action: 'REJECT',
                reason: 'Insufficient balance. Transaction cannot be processed.',
                riskScore: 0
            });
            setStep('REVIEW');
            return;
        }

        // Mock Metadata based on Demo Config
        const metadata = {
            deviceType: demoDevice,
            locationType: demoLocation,
            timeContext: demoTime,
            timestamp: Date.now(),
            riskScore: 0
        };

        setProcessing(true);
        const result = await analyzeTransaction(parsedAmount, metadata, {
            safeMode,
            isUnknownSender: false, // We are sending to someone
            flow: 'SEND',
            senderId: currentUser?.id,
            receiverId: selectedUser.id
        });
        setProcessing(false);

        setFraudResult(result);
        setStep('REVIEW');
    };

    const confirmTransaction = async (overrideAction?: 'APPROVE' | 'REJECT') => {
        if (processing) return; // Prevent double clicks
        setProcessing(true);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const finalAction = overrideAction || fraudResult?.action;
        const finalStatus = finalAction === 'REJECT' ? TransactionStatus.BLOCKED : TransactionStatus.SUCCESS;
        const parsedAmount = parseInt(amount, 10);

        if (finalAction !== 'FLAG' && !isNaN(parsedAmount)) {
            addTransaction({
                id: `tx_${Date.now()}`,
                senderId: currentUser?.id || 'unknown',
                receiverId: selectedUser!.id,
                senderName: currentUser?.name || 'Unknown',
                receiverName: selectedUser!.name,
                amount: parsedAmount,
                date: new Date().toISOString(),
                status: finalStatus,
                metadata: {
                    deviceType: demoDevice,
                    locationType: demoLocation,
                    timeContext: demoTime,
                    timestamp: Date.now(),
                    riskScore: fraudResult?.riskScore || 0,
                    flagReason: fraudResult?.reason
                }
            });
        }

        setTransactionStatus(finalStatus);
        setProcessing(false);
        setStep('RESULT');
    };

    // Auto-advance logic moved to useEffect to prevent double triggers
    useEffect(() => {
        if (step === 'REVIEW' && !processing) {
            if (fraudResult?.action === 'REJECT') {
                const timer = setTimeout(() => confirmTransaction('REJECT'), 1500);
                return () => clearTimeout(timer);
            } else if (fraudResult?.action === 'APPROVE') {
                const timer = setTimeout(() => confirmTransaction('APPROVE'), 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [step, fraudResult, processing]);

    // --- RENDERERS ---

    if (step === 'SELECT_USER') {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-brand-700 text-white">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
                    <h2 className="font-semibold">Send Money</h2>
                </div>
                <div className="p-4 bg-brand-700 pb-8 rounded-b-3xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search name or Number"
                            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900 placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto -mt-4 pt-4 bg-white rounded-t-3xl px-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-4">Contacts</h3>
                    {filteredUsers.map(user => (
                        <button key={user.id} onClick={() => handleUserSelect(user)} className="w-full p-3 flex items-center gap-4 hover:bg-gray-50 rounded-xl transition-colors">
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                            <div className="text-left">
                                <p className="font-bold text-gray-800">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'ENTER_AMOUNT') {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="p-4 flex items-center gap-2 bg-brand-700 text-white">
                    <button onClick={() => setStep('SELECT_USER')} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
                    <div className="flex items-center gap-3">
                        <img src={selectedUser?.avatar} className="w-8 h-8 rounded-full border-2 border-white/20" />
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-sm leading-none">Paying {selectedUser?.name}</span>
                            <span className="text-[10px] opacity-80">{selectedUser?.phoneNumber}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-6 relative">
                    <div className="absolute top-0 inset-x-0 h-24 bg-brand-700 rounded-b-[40px] opacity-10 pointer-events-none"></div>

                    <div className="mt-10 mb-8 flex flex-col items-center">
                        <p className="text-gray-500 mb-2 font-medium">Enter Amount</p>
                        <div className="flex items-center justify-center text-5xl font-bold text-gray-900">
                            <span>₹</span>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                className="w-48 text-center focus:outline-none placeholder:text-gray-200 bg-transparent"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        
                        {/* HELPER MESSAGE: Available Balance vs Entered Amount */}
                        {currentUser && parseInt(amount || '0', 10) > currentUser.balance ? (
                           <p className="text-red-500 text-sm mt-4 font-bold bg-red-50 px-4 py-1.5 rounded-full border border-red-100 flex items-center gap-2">
                               <AlertTriangle size={14} /> Insufficient Balance (Available: ₹{(currentUser.balance || 0).toLocaleString('en-IN')})
                           </p>
                        ) : (
                           <p className="text-gray-400 text-xs mt-4 font-medium">Available Balance: ₹{(currentUser?.balance || 0).toLocaleString('en-IN')}</p>
                        )}
                    </div>

                    {/* DEMO CONTROLS TOGGLE */}
                    <div className="w-full mb-8">
                        <button
                            onClick={() => setShowDemoConfig(!showDemoConfig)}
                            className="mx-auto flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-full hover:bg-brand-100 transition-colors"
                        >
                            <Settings2 size={14} />
                            {showDemoConfig ? 'Hide Demo Config' : 'Configure Fraud Scenario (Sender Side)'}
                        </button>

                        {showDemoConfig && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm space-y-3 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Device:</span>
                                    <select
                                        value={demoDevice}
                                        onChange={(e) => setDemoDevice(e.target.value as DeviceType)}
                                        className="p-1 rounded border border-gray-300 bg-white"
                                    >
                                        <option value="MOBILE">Mobile</option>
                                        <option value="LAPTOP">Laptop</option>
                                        <option value="DESKTOP">Desktop</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Location:</span>
                                    <select
                                        value={demoLocation}
                                        onChange={(e) => setDemoLocation(e.target.value as LocationType)}
                                        className="p-1 rounded border border-gray-300 bg-white"
                                    >
                                        <option value="SAME_STATE">Same State</option>
                                        <option value="DIFF_STATE">Diff State</option>
                                        <option value="DIFF_COUNTRY">Diff Country</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Time:</span>
                                    <select
                                        value={demoTime}
                                        onChange={(e) => setDemoTime(e.target.value as TimeContext)}
                                        className="p-1 rounded border border-gray-300 bg-white"
                                    >
                                        <option value="DAY">Day Time</option>
                                        <option value="MIDNIGHT">Midnight</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={initiateTransaction}
                        disabled={!amount || parseInt(amount || '0') <= 0 || processing || (currentUser !== null && parseInt(amount, 10) > currentUser.balance)}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all mt-auto ${
                            (currentUser && parseInt(amount || '0', 10) > currentUser.balance)
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                            : 'bg-brand-600 text-white shadow-xl shadow-brand-200 hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none'
                        }`}
                    >
                        {processing ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </div>
                        ) : 'Pay Securely'}
                    </button>
                </div>
            </div>
        );
    }

    // --- REVIEW SCREEN (For Sender) ---
    if (step === 'REVIEW') {
        const parsedAmount = parseInt(amount, 10);

        // FLAG Action requires Manual Confirmation (Buttons)
        if (fraudResult?.action === 'FLAG') {
            return (
                <div className="flex flex-col h-full bg-white p-6 justify-center items-center text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Check</h2>
                    
                    {/* RISK SCORE GRAPHIC */}
                    <div className="w-full bg-gray-50 border border-amber-100 rounded-xl p-4 mb-4 mt-2 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Score</span>
                             <span className="font-bold text-amber-600 text-xl">{Math.round(fraudResult.riskScore)}<span className="text-sm text-gray-400">/100</span></span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, fraudResult.riskScore))}%` }}></div>
                        </div>
                    </div>

                    <p className="text-amber-800 text-sm mb-6 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">{fraudResult.reason}</p>

                    <div className="bg-gray-50 p-4 rounded-xl w-full mb-8 text-left space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">₹{parsedAmount}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Device</span><span className="font-bold">{demoDevice}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-bold">{demoLocation}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => confirmTransaction('REJECT')}
                            disabled={processing}
                            className="py-3 px-4 rounded-xl border font-bold text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmTransaction('APPROVE')}
                            disabled={processing}
                            className="py-3 px-4 rounded-xl bg-brand-600 text-white font-bold"
                        >
                            {processing ? <Loader2 className="animate-spin mx-auto" /> : 'Allow'}
                        </button>
                    </div>
                </div>
            );
        }

        // Auto-Reject flow (Handled by useEffect)
        if (fraudResult?.action === 'REJECT') {
            return (
                <div className="flex flex-col h-full bg-white justify-center items-center px-6">
                    {fraudResult?.riskScore === 0 && fraudResult?.reason.includes('balance') ? (
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={40} />
                        </div>
                    ) : (
                        <Loader2 className="animate-spin text-red-500 mb-4" size={32} />
                    )}
                    <p className="text-red-700 font-bold text-xl mb-4 text-center">
                        {fraudResult?.riskScore === 0 && fraudResult?.reason.includes('balance') ? 'Transaction Failed' : 'Blocking Suspicious Transaction...'}
                    </p>
                    
                    {fraudResult?.riskScore > 0 && (
                        <div className="w-full max-w-sm bg-gray-50 border border-red-100 rounded-xl p-4 mb-4 shadow-sm animate-in zoom-in duration-300">
                            <div className="flex justify-between items-end mb-2">
                                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Score</span>
                                 <span className="font-bold text-red-600 text-xl">{Math.round(fraudResult.riskScore)}<span className="text-sm text-gray-400">/100</span></span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-red-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, fraudResult.riskScore))}%` }}></div>
                            </div>
                        </div>
                    )}

                    <p className="text-red-800 text-sm mt-2 text-center bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm font-medium">{fraudResult?.reason}</p>
                </div>
            );
        }

        // Auto-Approve flow (Handled by useEffect)
        return (
            <div className="flex flex-col h-full bg-white justify-center items-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-200 rounded-full animate-ping opacity-20"></div>
                    <ShieldCheck className="text-brand-600 mb-6 relative z-10" size={64} />
                </div>
                <p className="text-gray-900 font-bold">Safe Mode Verified</p>
                <p className="text-gray-400 text-sm mt-1">{fraudResult?.reason}</p>
            </div>
        );
    }

    // --- RESULT SCREEN ---
    const parsedAmount = parseInt(amount || '0', 10);

    return (
        <div className="flex flex-col h-full bg-white items-center justify-center p-8 text-center animate-in zoom-in duration-300">
            {transactionStatus === TransactionStatus.SUCCESS ? (
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Successful</h2>
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl w-full border border-gray-100">
                        <p className="text-3xl font-bold text-gray-900">₹{parsedAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">Paid to {selectedUser?.name}</p>
                    </div>
                </div>
            ) : (
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Transaction Blocked</h2>
                    <p className="text-red-600 mt-2 font-medium px-4">{fraudResult?.reason || 'Security Policy Violation'}</p>
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <ShieldCheck size={14} className="text-brand-600" />
                        <span className="text-xs font-bold text-gray-500">Fraud Protection Active</span>
                    </div>
                </div>
            )}

            <button onClick={onComplete} className="mt-auto bg-gray-900 text-white px-10 py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors shadow-lg">
                Done
            </button>
        </div>
    );
};