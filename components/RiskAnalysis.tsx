import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ShieldCheck, Smartphone, MapPin, Clock, Wifi, AlertTriangle, PhoneOff, Laptop, Monitor, Globe, Moon, Sun, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Transaction, DeviceType, LocationType } from '../types';

interface RiskAnalysisProps {
  onBack: () => void;
  transaction?: Transaction;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ onBack, transaction }) => {
  const { users } = useApp();
  const isSpecific = !!transaction;

  // --- ANALYSIS LOGIC ---
  const signals = (transaction?.metadata as any)?.signals || {};
  const sysDevice = signals?.device || {};
  const sysLocation = signals?.location || {};
  const sysTime = signals?.time || {};

  const deviceData = {
      title: 'Device Identity',
      val: sysDevice?.value || 'Unknown',
      desc: sysDevice?.description || 'No device information available.',
      score: sysDevice?.score ?? 50,
      icon: Smartphone,
      status: sysDevice?.status || 'UNKNOWN'
  };

  const locationData = {
      title: 'Geo-Location',
      val: sysLocation?.value || 'Unknown',
      desc: sysLocation?.description || 'No location data available.',
      score: sysLocation?.score ?? 50,
      icon: MapPin,
      status: sysLocation?.status || 'UNKNOWN'
  };

  const timeData = {
      title: 'Behavioral Time',
      val: sysTime?.value || 'Unknown',
      desc: sysTime?.description || 'No time data available.',
      score: sysTime?.score ?? 50,
      icon: Clock,
      status: sysTime?.status || 'UNKNOWN'
  };

  const riskScore = transaction?.metadata.riskScore ?? 0;
  const isHighRisk = riskScore > 50;
  const integrityScore = 100 - riskScore;

  const senderUser = isSpecific ? users.find(u => u.id === transaction.senderId) : null;
  const isUnknownSender = senderUser?.isUnknown;

  // --- HELPER FOR STYLES ---
  const getCardStyle = (score: number) => {
      if (score >= 80) return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-100',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-900',
          subText: 'text-emerald-700',
          BadgeIcon: CheckCircle2
      };
      if (score >= 40) return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900',
          subText: 'text-amber-700',
          BadgeIcon: AlertCircle
      };
      return {
          bg: 'bg-rose-50',
          border: 'border-rose-100',
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-600',
          textColor: 'text-rose-900',
          subText: 'text-rose-700',
          BadgeIcon: XCircle
      };
  };

  const renderAnalysisCard = (data: any, delay: string) => {
      const style = getCardStyle(data.score);
      const Icon = data.icon;
      const BadgeIcon = style.BadgeIcon;

      return (
          <div className={`flex items-start gap-4 p-4 rounded-2xl border ${style.bg} ${style.border} ${delay} animate-in slide-in-from-bottom-4 fill-mode-both`}>
              <div className={`p-3 rounded-xl ${style.iconBg} ${style.iconColor} shrink-0`}>
                  <Icon size={24} />
              </div>
              <div className="flex-1">
                  <div className="flex justify-between items-start">
                      <h4 className={`font-bold text-sm ${style.textColor} uppercase tracking-wide mb-1`}>{data.title}</h4>
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/60 ${style.iconColor}`}>
                          <BadgeIcon size={12} />
                          {data.status}
                      </div>
                  </div>
                  <p className={`font-bold text-lg ${style.textColor} mb-1`}>{data.val}</p>
                  <p className={`text-xs ${style.subText} leading-relaxed`}>{data.desc}</p>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Header */}
      <div className={`p-6 pb-12 ${isHighRisk ? 'bg-rose-600' : 'bg-brand-800'} text-white rounded-b-[40px] shadow-xl relative overflow-hidden transition-colors duration-500`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         
         <div className="relative z-10">
            <button onClick={onBack} className="bg-white/10 p-2 rounded-full mb-6 hover:bg-white/20 transition-colors backdrop-blur-md">
                <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Risk Analysis</h1>
                    <p className="opacity-80 text-sm">Transaction ID: {transaction?.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Safety Score</p>
                    <p className="text-4xl font-bold">{integrityScore}%</p>
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="mt-6 h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-red-300' : 'bg-green-400'}`} 
                    style={{ width: `${integrityScore}%` }}
                ></div>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 -mt-8 space-y-4">
          
          {/* Sender Warning if Unknown */}
          {isSpecific && isUnknownSender && (
              <div className="bg-white p-4 rounded-2xl shadow-lg border-l-4 border-red-500 flex items-center gap-4 animate-in zoom-in duration-300">
                  <div className="bg-red-100 p-3 rounded-full text-red-600">
                      <PhoneOff size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-900">Unknown Sender</h3>
                      <p className="text-xs text-gray-500">Number not in your contacts list.</p>
                  </div>
              </div>
          )}

          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2 mt-2">Detected Signals</h3>
          
          {renderAnalysisCard(deviceData, 'delay-75')}
          {renderAnalysisCard(locationData, 'delay-150')}
          {renderAnalysisCard(timeData, 'delay-200')}

          {/* Final Verdict */}
          <div className={`mt-6 p-5 rounded-2xl text-center border-2 ${isHighRisk ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isHighRisk ? 'text-red-400' : 'text-green-500'}`}>System Recommendation</p>
              <h2 className={`text-xl font-black ${isHighRisk ? 'text-red-700' : 'text-green-700'}`}>
                  {isHighRisk ? 'HIGH RISK DETECTED' : 'TRANSACTION SAFE'}
              </h2>
              <p className={`text-xs mt-2 ${isHighRisk ? 'text-red-600' : 'text-green-600'}`}>
                  {isHighRisk ? 'We strongly recommend rejecting this payment.' : 'No anomalies found. Safe to proceed.'}
              </p>
          </div>
          
          <div className="h-8"></div>
      </div>
    </div>
  );
};