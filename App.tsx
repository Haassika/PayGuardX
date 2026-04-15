import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SendMoneyFlow } from './components/SendMoneyFlow';
import { RiskAnalysis } from './components/RiskAnalysis';
import { User, TransactionStatus, Transaction } from './types';
import { User as UserIcon, LogOut, Lock, Phone, AlertTriangle, ShieldAlert, CheckCircle, XCircle, Activity, ShieldCheck, UserPlus, X, ArrowRight } from 'lucide-react';

const LandingScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [typedText, setTypedText] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const fullText = "Secure AI-Powered Payments";
  
  useEffect(() => {
    let i = 0;
    const intervalId = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(intervalId);
      }
    }, 50);
    return () => clearInterval(intervalId);
  }, []);

  const handleExit = () => {
      setIsExiting(true);
      setTimeout(() => {
          onEnter();
      }, 500); // 500ms for exit animation
  };

  return (
    <div className={`absolute inset-0 z-[200] bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-900 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-500 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'} animate-in fade-in duration-500`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
      
      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
         <ShieldCheck className="text-brand-100" size={48} />
      </div>
      
      <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
        Welcome to<br/><span className="text-brand-200">PayGuardX</span>
      </h1>
      
      <div className="h-12 flex justify-center items-center mb-6">
          <p className="text-lg font-medium text-brand-100/90 text-center">
             {typedText}
             <span className="animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.7)] ml-1">|</span>
          </p>
      </div>

      <p className="text-sm text-brand-100/70 mb-12 max-w-xs leading-relaxed animate-in slide-in-from-bottom duration-1000 delay-500 fill-mode-both">
        Your transactions are protected in real-time using intelligent fraud detection.
      </p>
      
      <button 
        onClick={handleExit} 
        disabled={isExiting}
        className="mt-auto w-full py-4 bg-white text-brand-800 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-brand-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group animate-in slide-in-from-bottom duration-1000 delay-700 fill-mode-both"
      >
        Let's Get Started
        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
      </button>
    </div>
  );
};

const LoginScreen: React.FC = () => {
  const { users, login, registerUser } = useApp();
  const loginUsers = users.filter(u => !u.isUnknown);
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUpi, setRegUpi] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regName && regPhone && regUpi) {
      registerUser(regName, regPhone, regUpi);
      setShowRegister(false);
      setRegName('');
      setRegPhone('');
      setRegUpi('');
    }
  };

  return (
    <div className="h-full bg-brand-700 flex flex-col p-8">
      <div className="mt-10 mb-8 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
           <Lock className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to PayGuardX</h1>
        <p className="text-brand-100 opacity-80">Select a user to simulate transactions.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8 no-scrollbar">
        {loginUsers.map(user => (
          <button 
            key={user.id} 
            onClick={() => login(user.id)}
            className="w-full bg-white p-4 rounded-xl flex items-center gap-4 hover:bg-brand-50 transition-all active:scale-95 shadow-md"
          >
            <img src={user.avatar} className="w-12 h-12 rounded-full border border-gray-200" alt={user.name} />
            <div className="text-left flex-1">
              <h3 className="font-bold text-gray-800">{user.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{user.phoneNumber}</p>
            </div>
            <div className="text-right">
               <p className="text-xs text-gray-400 font-medium">Balance</p>
               <p className="font-bold text-brand-700">₹{user.balance.toLocaleString('en-IN', { notation: 'compact' })}</p>
            </div>
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => setShowRegister(true)}
        className="mt-4 mb-2 flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
      >
        <UserPlus size={20} />
        Create New Account
      </button>

      <p className="text-center text-brand-200 text-xs mt-2">Student Fraud Detection Demo Project</p>

      {/* Registration Modal */}
      {showRegister && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
              <button onClick={() => setShowRegister(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input required type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input required type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UPI ID</label>
                <input required type="text" value={regUpi} onChange={e => setRegUpi(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="john@upi" />
              </div>
              <button type="submit" className="w-full py-3.5 mt-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-colors">
                Register & Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const IncomingRequestModal: React.FC = () => {
    const { incomingRequest, resolveTransaction, unknownSenderCounts, users } = useApp();
    const [showAnalysis, setShowAnalysis] = useState(false);

    if (!incomingRequest || incomingRequest.status !== TransactionStatus.PENDING) {
        // Reset analysis view when modal closes
        if (showAnalysis && !incomingRequest) setShowAnalysis(false);
        return null;
    }

    // If analysis view is triggered, show the RiskAnalysis component in full modal
    if (showAnalysis) {
        return (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300">
                <RiskAnalysis 
                    onBack={() => setShowAnalysis(false)} 
                    transaction={incomingRequest}
                />
            </div>
        );
    }

    const sender = users.find(u => u.id === incomingRequest.senderId);
    const count = sender?.isUnknown ? (unknownSenderCounts[sender.phoneNumber] || 0) : 0;
    
    return (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-center text-gray-900 mb-1">Incoming Payment Alert</h3>
                <p className="text-center text-sm text-gray-500 mb-6 px-4 leading-relaxed">{incomingRequest.metadata.flagReason}</p>

                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">From</span>
                        <div className="text-right">
                             {sender?.isUnknown ? (
                                 <div className="flex flex-col items-end">
                                    <span className="font-bold text-gray-900 text-lg">{sender.phoneNumber}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Unknown Number</span>
                                    </div>
                                    {count > 0 ? (
                                        <span className="text-xs text-brand-600 font-medium mt-1">
                                            Money received {count} time{count !== 1 ? 's' : ''} before
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 mt-1">First time sender</span>
                                    )}
                                 </div>
                             ) : (
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-gray-900">{incomingRequest.senderName}</span>
                                    <span className="text-xs text-gray-500">{sender?.phoneNumber}</span>
                                </div>
                             )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Amount</span>
                        <span className="font-bold text-2xl text-gray-900">₹{incomingRequest.amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                        onClick={() => resolveTransaction(incomingRequest.id, false)}
                        className="py-3.5 px-4 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors"
                    >
                        Reject
                    </button>
                    <button 
                         onClick={() => resolveTransaction(incomingRequest.id, true)}
                        className="py-3.5 px-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                    >
                        Allow
                    </button>
                </div>

                {/* Risk Analysis Link */}
                <button 
                    onClick={() => setShowAnalysis(true)}
                    className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    <Activity size={16} className="text-gray-500" />
                    Check Risk Level Analysis
                </button>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [view, setView] = useState<'DASHBOARD' | 'SEND_MONEY' | 'RISK_ANALYSIS'>('DASHBOARD');
  const [analyzingTransaction, setAnalyzingTransaction] = useState<Transaction | null>(null);
  
  const { currentUser, userTransactions, logout, users, unknownSenderCounts, resolveTransaction } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleTabChange = (tab: 'home' | 'history' | 'profile') => {
    setActiveTab(tab);
    setView('DASHBOARD');
  };

  const renderContent = () => {
    if (view === 'RISK_ANALYSIS') {
      return (
        <div className="h-full bg-white z-50 absolute inset-0">
          <RiskAnalysis 
            onBack={() => {
                setView('DASHBOARD');
                setAnalyzingTransaction(null);
            }} 
            transaction={analyzingTransaction || undefined}
          />
        </div>
      );
    }

    if (view === 'SEND_MONEY') {
      return (
        <div className="h-full bg-white z-50 absolute inset-0">
          <SendMoneyFlow 
            onBack={() => setView('DASHBOARD')} 
            onComplete={() => setView('DASHBOARD')}
          />
        </div>
      );
    }

    if (activeTab === 'home') {
      return (
        <Dashboard 
            onSendClick={() => setView('SEND_MONEY')} 
            onAnalysisClick={() => {
                setAnalyzingTransaction(null);
                setView('RISK_ANALYSIS');
            }}
            onTransactionSelect={(t) => {
                setAnalyzingTransaction(t);
                setView('RISK_ANALYSIS');
            }} 
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Transaction History</h2>
          <div className="space-y-4">
             {userTransactions.length === 0 ? (
                 <p className="text-center text-gray-400 mt-10">No records found</p>
             ) : (
                userTransactions.map(t => {
                   const isReceived = t.receiverId === currentUser.id;
                   const displayAmount = isReceived ? `+ ₹${t.amount.toLocaleString()}` : `- ₹${t.amount.toLocaleString()}`;
                   const otherUser = users.find(u => u.id === (isReceived ? t.senderId : t.receiverId));
                   
                   let displayName = isReceived ? `Received from ${t.senderName}` : `Paid to ${t.receiverName}`;
                   if (otherUser?.isUnknown) {
                       const count = unknownSenderCounts[otherUser.phoneNumber] || 0;
                       displayName = isReceived 
                          ? `Unknown: ${otherUser.phoneNumber}`
                          : `Paid to ${otherUser.phoneNumber}`;
                   }

                   const colorClass = isReceived ? 'text-green-600' : 'text-gray-900';
                   const isPending = t.status === TransactionStatus.PENDING;
                   const isFailed = t.status === 'FAILED' || t.status === 'BLOCKED';
                   const isHighRisk = (t.metadata?.riskScore || 0) > 50;

                   return (
                    <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        {isPending && (
                            <div className="absolute top-0 right-0 p-1 px-3 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-bl-xl">
                                ACTION REQUIRED
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-2 mt-1">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                                {isReceived && otherUser?.isUnknown && (unknownSenderCounts[otherUser.phoneNumber] || 0) > 0 && (
                                     <span className="text-[10px] text-gray-400">Previous payments: {unknownSenderCounts[otherUser.phoneNumber]}</span>
                                )}
                                <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</p>
                                
                                {/* Risk Analysis for History Items */}
                                <button 
                                    onClick={() => {
                                        setAnalyzingTransaction(t);
                                        setView('RISK_ANALYSIS');
                                    }}
                                    className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors border w-fit ${
                                        isHighRisk 
                                        ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' 
                                        : 'text-brand-600 bg-brand-50 border-brand-100 hover:bg-brand-100'
                                    }`}
                                >
                                    {isHighRisk ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                    Check Risk
                                </button>
                            </div>
                            { !isPending && (
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    t.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {t.status}
                                </span>
                            )}
                        </div>
                        
                        {isPending ? (
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
                                    <span className="font-bold text-gray-700">Reason:</span> {t.metadata.flagReason}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => resolveTransaction(t.id, false)}
                                        className="flex-1 py-2 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50"
                                    >
                                        REJECT
                                    </button>
                                    <button 
                                        onClick={() => resolveTransaction(t.id, true)}
                                        className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-200"
                                    >
                                        ALLOW
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-end border-t border-gray-50 pt-3 mt-2">
                                <div className="text-xs text-gray-500">
                                    {isFailed && t.metadata.flagReason && <p className="text-red-500 mt-1 max-w-[200px] truncate">{t.metadata.flagReason}</p>}
                                </div>
                                <p className={`font-bold text-lg ${isFailed ? 'text-gray-400 line-through' : colorClass}`}>
                                    {displayAmount}
                                </p>
                            </div>
                        )}
                    </div>
                   );
                })
             )}
          </div>
        </div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <div className="p-6 flex flex-col items-center">
           <div className="w-24 h-24 bg-brand-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg">
             <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
           </div>
           <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
           <p className="text-gray-500 mb-8 font-medium">{currentUser.phoneNumber}</p>

           <div className="w-full space-y-3">
             <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
               <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                 <UserIcon size={20} />
               </div>
               <div className="flex-1">
                 <p className="font-bold text-sm text-gray-700">Account Details</p>
                 <p className="text-xs text-gray-400">{currentUser.upiId}</p>
               </div>
             </div>
             
             <div className="p-4 rounded-xl border border-yellow-100 bg-yellow-50 flex flex-col gap-2 mt-2">
                 <div className="flex items-center gap-2 text-yellow-700 font-bold text-sm">
                     <ShieldAlert size={16} />
                     <span>Safe Mode Rules</span>
                 </div>
                 <ul className="text-xs text-yellow-800 space-y-1 list-disc pl-4">
                     <li>{"Mobile, Local, Day -> Auto Allow"}</li>
                     <li>{"Laptop, Diff State -> Ask Permission"}</li>
                     <li>{"Desktop, Foreign, Midnight -> Block"}</li>
                     <li>{"Unknown Sender -> Ask Permission"}</li>
                 </ul>
             </div>

             <button 
                onClick={logout}
                className="w-full bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4 text-red-600 mt-6 active:scale-[0.98] transition-transform"
             >
               <div className="p-2 bg-white rounded-lg">
                 <LogOut size={20} />
               </div>
               <p className="font-bold text-sm">Switch User / Logout</p>
             </button>
           </div>
        </div>
      );
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
      <IncomingRequestModal />
    </Layout>
  );
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  const handleEnterApp = () => {
    localStorage.setItem('payguardx_hasSeenLanding', 'true');
    setShowLanding(false);
  };

  return (
    <AppProvider>
      {showLanding ? (
        <LandingScreen onEnter={handleEnterApp} />
      ) : (
        <AppContent />
      )}
    </AppProvider>
  );
};

export default App;