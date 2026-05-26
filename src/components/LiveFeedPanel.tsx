import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { MatchSession, LiveMatchData } from '../types';
import { getLiveMatchUpdate } from '../services/geminiService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface LiveFeedPanelProps {
  session: MatchSession;
}

export default function LiveFeedPanel({ session }: LiveFeedPanelProps) {
  const [liveData, setLiveData] = useState<LiveMatchData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const fetchUpdate = async () => {
    if (liveData?.status === 'finished') return;
    if (isQuotaExceeded) return;
    
    setIsPolling(true);
    try {
      const data = await getLiveMatchUpdate(session);
      setLiveData(data);
      setError(null);
      setIsQuotaExceeded(false);
    } catch (err: any) {
      const errMsg = err?.message || '';
      console.error('Failed to fetch live update', errMsg);
      
      if (errMsg === 'QUOTA_EXCEEDED') {
        setIsQuotaExceeded(true);
        setError('Rate limit reached. Live updates paused.');
      } else if (errMsg === 'SERVER_ERROR') {
        setError('Sports data server is busy. Retrying soon...');
      } else {
        setError('Live data temporarily unavailable');
      }
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchUpdate();
    const interval = setInterval(fetchUpdate, isQuotaExceeded ? 120000 : 30000); // 2min if quota hit, else 30s
    return () => clearInterval(interval);
  }, [session.teamA.id, session.teamB.id, isQuotaExceeded]);

  if (!liveData && isPolling && !isQuotaExceeded) {
    return (
      <div className="glass-morphism p-8 rounded-3xl flex flex-col items-center justify-center space-y-4">
        <Activity className="animate-pulse text-brand-primary" size={32} />
        <p className="text-slate-500 animate-pulse text-sm">Searching for live match events...</p>
      </div>
    );
  }

  const handleRetry = () => {
    setIsQuotaExceeded(false);
    setError(null);
    fetchUpdate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-2xl flex items-center gap-2">
          <Zap className="text-brand-secondary fill-brand-secondary/20" size={24} />
          Live Match Feed
          {liveData?.status === 'live' && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping ml-1" />
          )}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <RefreshCw size={10} className={cn(isPolling && "animate-spin")} />
            {isQuotaExceeded ? 'Paused' : liveData?.status === 'finished' ? 'Final Result' : 'Auto-refresh 30s'}
          </span>
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            liveData?.status === 'live' ? "bg-red-500/10 text-red-500 border-red-500/20" :
            liveData?.status === 'finished' ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
            "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
          )}>
            {liveData?.status || 'Scheduled'}
          </div>
          {liveData?.actualStartTime && (
            <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/5 text-slate-400">
              Starts: {liveData.actualStartTime}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Card */}
        <div className="glass-morphism p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <img src={session.teamA.logo} referrerPolicy="no-referrer" alt="" className="w-12 h-12 object-contain mb-2" />
              <span className="text-sm font-bold text-center">{session.teamA.shortName}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <div className="text-4xl font-display font-bold tabular-nums">
                {liveData?.score?.home ?? 0} : {liveData?.score?.away ?? 0}
              </div>
              <div className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded mt-2">
                {liveData?.currentMinute ? `${liveData.currentMinute}'` : '0\''}
              </div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <img src={session.teamB.logo} referrerPolicy="no-referrer" alt="" className="w-12 h-12 object-contain mb-2" />
              <span className="text-sm font-bold text-center">{session.teamB.shortName}</span>
            </div>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="glass-morphism p-6 rounded-2xl border border-white/5 h-[200px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Match Timeline</h4>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {liveData?.events && liveData.events.length > 0 ? (
              liveData.events.sort((a, b) => b.minute - a.minute).map((event, idx) => (
                <div key={idx} className="flex gap-3 items-start border-l border-white/10 pl-3 relative">
                  <div className={cn(
                    "absolute -left-[5px] top-1.5 w-2 h-2 rounded-full",
                    event.type === 'goal' ? "bg-green-500" :
                    event.type === 'card' ? "bg-yellow-500" :
                    "bg-brand-primary"
                  )} />
                  <span className="text-[10px] font-bold text-slate-500 w-6">{event.minute}'</span>
                  <div>
                    <p className="text-xs font-bold">
                      {event.player} {event.type === 'goal' && '⚽'}
                    </p>
                    <p className="text-[10px] text-slate-500">{event.detail}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Activity size={24} className="mb-2" />
                <p className="text-[10px]">No major events reported yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-[10px] text-red-500">
            <AlertCircle size={14} />
            {error}
          </div>
          {isQuotaExceeded && (
            <button 
              onClick={handleRetry}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[10px] font-bold text-red-500 transition-colors"
            >
              Retry Now
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
