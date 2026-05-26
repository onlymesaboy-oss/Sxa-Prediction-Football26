import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Wand2, Loader2, Calendar, History, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PredictionPanel from './components/PredictionPanel';
import StatsPanel from './components/StatsPanel';
import { POPULAR_LEAGUES, TEAMS_BY_LEAGUE, MatchSession, League, Team } from './types';
import { generateMatchPrediction } from './services/geminiService';
import { cn, findBestMatch } from './lib/utils';
import { format } from 'date-fns';
import { auth, savePrediction, getPredictionHistory, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import LiveFeedPanel from './components/LiveFeedPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League>(POPULAR_LEAGUES[0]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<MatchSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const currentTeams = useMemo(() => {
    const teams = TEAMS_BY_LEAGUE[selectedLeague.id] || TEAMS_BY_LEAGUE['other'] || [];
    if (!searchQuery) return teams;
    return teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [selectedLeague, searchQuery]);

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualHomeName, setManualHomeName] = useState('');
  const [manualAwayName, setManualAwayName] = useState('');

  const allTeams = useMemo(() => {
    return Object.values(TEAMS_BY_LEAGUE).flat();
  }, []);

  const getTeamLogo = (teamName: string, existingLogo?: string) => {
    if (existingLogo) return existingLogo;
    
    // Fuzzy matching for logo auto-discovery
    const matchedTeam = findBestMatch(teamName, allTeams);
    if (matchedTeam) return matchedTeam.logo;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=1e293b&color=10b981&bold=true&size=128&font-size=0.4`;
  };

  const handleGenerate = async () => {
    let finalTeamA: Team;
    let finalTeamB: Team;

    if (isManualMode) {
      if (!manualHomeName || !manualAwayName) return;
      
      const matchA = findBestMatch(manualHomeName, allTeams);
      const matchB = findBestMatch(manualAwayName, allTeams);

      finalTeamA = { 
        id: matchA?.id || 'manual-a', 
        name: matchA?.name || manualHomeName, 
        shortName: matchA?.shortName || manualHomeName.substring(0, 3).toUpperCase(), 
        logo: getTeamLogo(manualHomeName, matchA?.logo) 
      };
      
      finalTeamB = { 
        id: matchB?.id || 'manual-b', 
        name: matchB?.name || manualAwayName, 
        shortName: matchB?.shortName || manualAwayName.substring(0, 3).toUpperCase(), 
        logo: getTeamLogo(manualAwayName, matchB?.logo) 
      };
    } else {
      if (!teamA || !teamB) return;
      finalTeamA = teamA;
      finalTeamB = teamB;
    }
    
    setIsLoading(true);
    const newSession: MatchSession = {
      id: Math.random().toString(36).substr(2, 9),
      league: selectedLeague,
      teamA: finalTeamA,
      teamB: finalTeamB,
      date: new Date().toISOString(),
    };

    const result = await generateMatchPrediction(newSession);
    
    // Smart discovery: Update manual team info if AI found better names/logos
    let finalSession = {
      ...newSession,
      prediction: result.prediction,
      stats: result.stats
    };

    if (isManualMode && result.stats.correctedTeams) {
      const { teamA: correctedA, teamB: correctedB } = result.stats.correctedTeams;
      finalSession = {
        ...finalSession,
        teamA: { ...finalSession.teamA, name: correctedA.name, shortName: correctedA.shortName, logo: correctedA.logo },
        teamB: { ...finalSession.teamB, name: correctedB.name, shortName: correctedB.shortName, logo: correctedB.logo },
      };
    }

    setSession(finalSession);
    
    // Save to history (Firestore) if user is logged in
    if (auth.currentUser) {
      try {
        await savePrediction(finalSession);
      } catch (e) {
        console.error('Failed to save to Firestore', e);
      }
    }

    setIsLoading(false);
  };

  const selectTeam = (team: Team) => {
    if (!teamA) {
      setTeamA(team);
    } else if (!teamB && team.id !== teamA.id) {
      setTeamB(team);
    } else if (team.id === teamA.id) {
      setTeamA(null);
    } else if (teamB && team.id === teamB.id) {
      setTeamB(null);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    const result = await getPredictionHistory();
    setHistoryItems(result);
    setShowHistory(true);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-bg-deep text-slate-100 selection:bg-brand-primary/30">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10 relative">
        {/* Floating History Toggle */}
        <button 
          onClick={loadHistory}
          className="fixed bottom-8 right-8 z-50 bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        >
          <History className="group-hover:rotate-12 transition-transform" />
          <div className="absolute right-full mr-4 bg-bg-card border border-white/5 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            <span className="text-xs font-bold">View History</span>
          </div>
        </button>

        {/* History Modal Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-card border-l border-white/5 z-[70] shadow-2xl overflow-y-auto custom-scrollbar"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-display font-bold">Prediction History</h3>
                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {historyItems.length === 0 ? (
                      <div className="text-center py-20 opacity-20">
                        <History size={48} className="mx-auto mb-4" />
                        <p>No history found</p>
                      </div>
                    ) : (
                      historyItems.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSession(item);
                            setShowHistory(false);
                          }}
                          className="glass-morphism p-5 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <img src={item.match.league.logo} referrerPolicy="no-referrer" alt="" className="w-4 h-4 object-contain" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{item.match.league.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{format(new Date(item.createdAt), 'MMM dd, HH:mm')}</span>
                          </div>
                          
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="flex flex-col items-center flex-1">
                              <img src={item.match.teamA.logo} referrerPolicy="no-referrer" alt="" className="w-8 h-8 object-contain mb-1" />
                              <span className="text-xs font-bold text-center truncate w-full">{item.match.teamA.shortName}</span>
                            </div>
                            <div className="bg-white/5 px-2 py-1 rounded-lg text-[10px] font-bold">VS</div>
                            <div className="flex flex-col items-center flex-1">
                              <img src={item.match.teamB.logo} referrerPolicy="no-referrer" alt="" className="w-8 h-8 object-contain mb-1" />
                              <span className="text-xs font-bold text-center truncate w-full">{item.match.teamB.shortName}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="text-[10px]">
                              <span className="text-slate-500 mr-2">Predicted Score:</span>
                              <span className="font-bold text-brand-primary">{item.prediction.correctScore}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                              <Wand2 size={12} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-display font-bold tracking-tight mb-2">Match Generator</h2>
            <p className="text-slate-400">Select two teams to generate AI-backed predictions</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex bg-bg-card p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setIsManualMode(false)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  !isManualMode ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                )}
              >
                Database
              </button>
              <button
                onClick={() => setIsManualMode(true)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  isManualMode ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                )}
              >
                Manual Entry
              </button>
            </div>
            <div className="flex items-center gap-4 bg-bg-card p-1 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar max-w-full md:max-w-3xl no-scrollbar">
            <div className="flex gap-2 min-w-max p-1">
              {POPULAR_LEAGUES.map(league => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league);
                    setTeamA(null);
                    setTeamB(null);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2",
                    selectedLeague.id === league.id 
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <img src={league.logo} referrerPolicy="no-referrer" alt="" className="w-5 h-5 object-contain" />
                  <span className="whitespace-nowrap">{league.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

        {/* Match Selection Area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-morphism rounded-3xl p-8 relative overflow-hidden">
               {/* Decorative background logo */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <img src={selectedLeague.logo} referrerPolicy="no-referrer" alt="" className="w-96 h-96 object-contain grayscale" />
               </div>

               <div className="flex items-center justify-center gap-8 md:gap-16 relative z-10">
                  <div className="flex flex-col items-center gap-4 w-1/3">
                    <div className={cn(
                      "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center transition-all duration-300 border-2",
                      (isManualMode ? manualHomeName : teamA) ? "bg-white/5 border-brand-primary shadow-2xl shadow-brand-primary/10" : "bg-white/5 border-dashed border-white/10"
                    )}>
                      {isManualMode ? (
                        manualHomeName ? (
                          <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={getTeamLogo(manualHomeName)} referrerPolicy="no-referrer" alt={manualHomeName} className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-xl" />
                        ) : (
                          <span className="text-slate-600 font-display font-bold text-3xl">H</span>
                        )
                      ) : teamA ? (
                        <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={teamA.logo} referrerPolicy="no-referrer" alt={teamA.name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                      ) : (
                        <span className="text-slate-600 font-display font-bold text-3xl">?</span>
                      )}
                    </div>
                    <span className="font-display font-bold text-center h-6 truncate w-full">
                      {isManualMode ? (manualHomeName || 'Home Team') : (teamA?.name || 'Home Team')}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="px-5 py-2 glass-morphism rounded-full font-display font-bold text-xl">VS</div>
                    <div className="flex items-center gap-2 text-slate-500">
                       <Calendar size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{format(new Date(), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-1/3">
                     <div className={cn(
                      "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center transition-all duration-300 border-2",
                      (isManualMode ? manualAwayName : teamB) ? "bg-white/5 border-brand-secondary shadow-2xl shadow-brand-secondary/10" : "bg-white/5 border-dashed border-white/10"
                    )}>
                      {isManualMode ? (
                        manualAwayName ? (
                          <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={getTeamLogo(manualAwayName)} referrerPolicy="no-referrer" alt={manualAwayName} className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-xl" />
                        ) : (
                          <span className="text-slate-600 font-display font-bold text-3xl">A</span>
                        )
                      ) : teamB ? (
                        <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={teamB.logo} referrerPolicy="no-referrer" alt={teamB.name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                      ) : (
                        <span className="text-slate-600 font-display font-bold text-3xl">?</span>
                      )}
                    </div>
                    <span className="font-display font-bold text-center h-6 truncate w-full">
                      {isManualMode ? (manualAwayName || 'Away Team') : (teamB?.name || 'Away Team')}
                    </span>
                  </div>
               </div>

               <div className="mt-10 flex justify-center">
                  <button
                    disabled={(isManualMode ? (!manualHomeName || !manualAwayName) : (!teamA || !teamB)) || isLoading}
                    onClick={handleGenerate}
                    className={cn(
                      "group relative px-10 py-4 rounded-2xl font-display font-bold text-xl overflow-hidden transition-all duration-300",
                      (!teamA || !teamB) ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-brand-primary text-white hover:scale-105 active:scale-95 shadow-xl shadow-brand-primary/20"
                    )}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                      {isLoading ? 'Calculating...' : 'Generate Prediction'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
               </div>
            </div>
          </div>

          <div className="glass-morphism rounded-3xl overflow-hidden h-[420px] flex flex-col">
            {isManualMode ? (
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-center">
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-brand-primary">Custom Match</h3>
                  <p className="text-xs text-slate-500">Enter names for teams from any league worldwide.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Home Team Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Manchester City" 
                      className="w-full bg-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 ring-brand-primary/50 transition-all border border-white/5"
                      value={manualHomeName}
                      onChange={(e) => setManualHomeName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Away Team Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Real Madrid" 
                      className="w-full bg-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 ring-brand-secondary/50 transition-all border border-white/5"
                      value={manualAwayName}
                      onChange={(e) => setManualAwayName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-2xl bg-white/5 text-[10px] text-slate-500 leading-relaxed">
                  AI will use historical data and current league trends to generate your prediction.
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-white/5">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search teams..." 
                        className="w-full bg-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-brand-primary/50 transition-all border border-white/5"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {currentTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => selectTeam(team)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-left group",
                        (teamA?.id === team.id || teamB?.id === team.id)
                          ? "bg-brand-primary/20 border border-brand-primary/30"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      )}
                    >
                      <img src={team.logo} referrerPolicy="no-referrer" alt="" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{team.name}</p>
                        <p className="text-[10px] text-slate-500">{team.shortName}</p>
                      </div>
                      {(teamA?.id === team.id || teamB?.id === team.id) && (
                        <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                           <span className="text-[10px] font-bold text-white">{teamA?.id === team.id ? '1' : '2'}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Prediction Display Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="w-16 h-16 border-4 border-white/5 border-t-brand-primary rounded-full animate-spin" />
              <div className="text-center">
                 <p className="font-display font-bold text-xl">Consulting AI Models</p>
                 <p className="text-slate-500 text-sm">Analyzing form, H2H, and market trends...</p>
              </div>
            </motion.div>
          ) : session?.prediction && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <LiveFeedPanel session={session} />
              
              <PredictionPanel 
                prediction={session.prediction} 
                teamA={session.teamA} 
                teamB={session.teamB} 
                stats={session.stats}
                session={session}
              />
              <StatsPanel 
                stats={session.stats!} 
                teamA={session.teamA} 
                teamB={session.teamB} 
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!session && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
             <Trophy size={80} className="mb-4" />
             <p className="font-display font-medium">Select teams to unlock predictions</p>
          </div>
        )}

        <footer className="pt-20 pb-10 text-center text-slate-500 text-xs">
           <p>© 2026 SXA TIPS Football26 • Powered by Gemini Ultra Intelligence</p>
           <p className="mt-2">Sports predictions are for entertainment purposes and contain risks. Bet responsibly.</p>
        </footer>
      </main>
    </div>
  );
}

function Trophy({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

