import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, QrCode, Smartphone, Wallet, Banknote, History, ChevronDown, ChevronUp, CheckCircle, Shield, AlertTriangle, XCircle, UserX, ShieldCheck, Clock, BarChart3, ArrowRight, ShieldAlert } from 'lucide-react';
import { Transaction } from '../types';

interface DashboardProps {
  onSendClick: () => void;
  onAnalysisClick: () => void;
  onTransactionSelect: (t: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSendClick, onAnalysisClick, onTransactionSelect }) => {
  const { currentUser, userTransactions, users, safeMode, simulationConfig, setSimulationConfig, triggerIncomingRequest } = useApp();
  const [showSimMenu, setShowSimMenu] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recentTransactions = userTransactions.slice(0, 10);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-xl shadow-brand-500/20 transform transition hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-brand-100 text-sm font-medium mb-1">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(currentUser?.balance || 0)}</h2>
          </div>
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/20">
            <QrCode size={24} />
          </div>
        </div>
        <div className="flex justify-between items-end">
             <div className="flex gap-2 text-xs font-medium text-brand-100 bg-black/20 w-fit px-3 py-1.5 rounded-full border border-white/10">
                <span>UPI ID:</span>
                <span className="text-white">{currentUser?.upiId}</span>
            </div>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-wider">{currentUser?.name}</p>
        </div>
      </div>

      {/* Quick Actions (Real Transfer) */}
      <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Transfer Money</p>
          <div className="grid grid-cols-4 gap-4">
            <button onClick={onSendClick} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:bg-brand-700 transition-all transform group-hover:scale-105">
                <Send size={22} className="-ml-1 mt-1" />
              </div>
              <span className="text-xs font-medium text-gray-700">To Mobile</span>
            </button>
            <button className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                <Banknote size={22} />
              </div>
              <span className="text-xs font-medium text-gray-500">To Bank</span>
            </button>
            <button className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                <Wallet size={22} />
              </div>
              <span className="text-xs font-medium text-gray-500">To Self</span>
            </button>
            <button className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed">
               <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                <Smartphone size={22} />
              </div>
              <span className="text-xs font-medium text-gray-500">Recharge</span>
            </button>
          </div>
      </div>

      {/* RECEIVER SIMULATION CONFIGURATION */}
      <div className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${safeMode ? 'bg-white border-brand-100' : 'bg-gray-50 border-gray-200'}`}>
        <button 
            onClick={() => setShowSimMenu(!showSimMenu)}
            className={`w-full flex justify-between items-center p-4 font-bold text-sm transition-colors ${safeMode ? 'bg-brand-50 text-brand-800' : 'bg-gray-100 text-gray-500'}`}
        >
            <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={safeMode ? 'text-brand-600' : 'text-gray-400'} />
                <span>Safe Mode: Incoming Rules</span>
                {safeMode && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                )}
            </div>
            {showSimMenu ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        
        {showSimMenu && (
            <div className="p-4 border-t border-dashed border-gray-200 bg-white">
                <div className="flex items-center justify-between text-xs mb-4">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">Select Protection Profile</span>
                    <span className={`font-bold text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 ${safeMode ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-red-100 text-gray-500'}`}>
                        {safeMode && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                        )}
                        {safeMode ? "ACTIVE" : "OFF"}
                    </span>
                </div>
                
                {/* CONFIGURATION BUTTONS */}
                <div className={`grid grid-cols-2 gap-2 mb-4 ${!safeMode ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button 
                        onClick={() => setSimulationConfig('TRUSTED')}
                        className={`p-3 rounded-lg text-left transition-all border ${
                            simulationConfig === 'TRUSTED' 
                            ? 'bg-green-50 border-green-500 ring-1 ring-green-500 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-green-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-800"><CheckCircle size={14} className={simulationConfig === 'TRUSTED' ? 'text-green-600' : 'text-gray-300'}/> Trusted</div>
                        <p className="text-[10px] opacity-70">{"Mobile • Local"}</p>
                    </button>
                    
                    <button 
                        onClick={() => setSimulationConfig('SUSPICIOUS')}
                        className={`p-3 rounded-lg text-left transition-all border ${
                            simulationConfig === 'SUSPICIOUS' 
                            ? 'bg-yellow-50 border-yellow-500 ring-1 ring-yellow-500 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-yellow-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-800"><AlertTriangle size={14} className={simulationConfig === 'SUSPICIOUS' ? 'text-yellow-600' : 'text-gray-300'}/> Suspicious</div>
                        <p className="text-[10px] opacity-70">{"Laptop • Diff State"}</p>
                    </button>

                    <button 
                        onClick={() => setSimulationConfig('BLOCK')}
                        className={`p-3 rounded-lg text-left transition-all border ${
                            simulationConfig === 'BLOCK' 
                            ? 'bg-red-50 border-red-500 ring-1 ring-red-500 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-red-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-800"><XCircle size={14} className={simulationConfig === 'BLOCK' ? 'text-red-600' : 'text-gray-300'}/> High Risk</div>
                        <p className="text-[10px] opacity-70">{"Desktop • Foreign"}</p>
                    </button>
                    
                    <button 
                        onClick={() => setSimulationConfig('UNKNOWN')}
                        className={`p-3 rounded-lg text-left transition-all border ${
                            simulationConfig === 'UNKNOWN' 
                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-purple-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-800"><UserX size={14} className={simulationConfig === 'UNKNOWN' ? 'text-purple-600' : 'text-gray-300'}/> Unknown #</div>
                        <p className="text-[10px] opacity-70">{"Any Device"}</p>
                    </button>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setShowSimMenu(false)}
                        className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors"
                    >
                        Done
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <History className="text-gray-400" size={20} />
            </div>
            <p className="text-gray-400 text-sm">No transactions yet</p>
            <p className="text-gray-300 text-xs mt-1">Receive payments to see history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((t) => {
              const isReceived = t.receiverId === currentUser?.id;
              const displayAmount = isReceived ? `+ ₹${t.amount.toLocaleString('en-IN')}` : `- ₹${t.amount.toLocaleString('en-IN')}`;
              
              const otherUser = users.find(u => u.id === (isReceived ? t.senderId : t.receiverId));
              let displayName = '';
              if (otherUser?.isUnknown) {
                  displayName = isReceived ? `Unknown (${otherUser.phoneNumber})` : `Paid to ${otherUser.phoneNumber}`;
              } else {
                  displayName = isReceived ? `Received from ${t.senderName}` : `Paid to ${t.receiverName}`;
              }

              const displayColor = isReceived ? 'text-green-600' : 'text-gray-900';
              const isFailed = t.status === 'FAILED' || t.status === 'BLOCKED';
              const isPending = t.status === 'PENDING';
              const isHighRisk = (t.metadata?.riskScore || 0) > 50;

              return (
                <div 
                    key={t.id} 
                    onClick={() => isPending ? triggerIncomingRequest(t) : null}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all ${
                        isPending ? 'cursor-pointer ring-1 ring-yellow-400 hover:bg-yellow-50 hover:shadow-md' : ''
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isFailed ? 'bg-red-500' : isReceived ? 'bg-green-500' : 'bg-brand-600'}`}>
                            {otherUser?.isUnknown ? '?' : (isReceived ? t.senderName[0] : t.receiverName[0])}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                            <p className="text-xs text-gray-500">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            
                            {/* RISK BUTTON ADDED HERE */}
                            {!isPending && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTransactionSelect(t);
                                    }}
                                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors border ${
                                        isHighRisk 
                                        ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' 
                                        : 'text-brand-600 bg-brand-50 border-brand-100 hover:bg-brand-100'
                                    }`}
                                >
                                    {isHighRisk ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                    Check Risk
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${isFailed ? 'text-gray-400 line-through' : displayColor}`}>
                            {displayAmount}
                        </p>
                        
                        {isPending ? (
                            <div className="flex items-center gap-1 text-yellow-600 justify-end mt-1 animate-pulse">
                                <Clock size={10} />
                                <p className="text-[10px] font-bold uppercase">Action Required</p>
                            </div>
                        ) : (
                            <p className={`text-[10px] font-bold uppercase ${
                                t.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'
                            }`}>{t.status}</p>
                        )}
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};