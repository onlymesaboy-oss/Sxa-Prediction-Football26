import { MatchStats, Team, PlayerStat, TacticalFormation, HistoricalPerformance } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MapPin, User, Users2, History, Target, TrendingUp, Activity, Award, Compass, Flag, Star, Crown } from 'lucide-react';

interface StatsPanelProps {
  stats: MatchStats;
  teamA: Team;
  teamB: Team;
}

// Sub-component for form history dots
function FormRow({ team, form }: { team: Team, form: string[] }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <img src={team.logo} referrerPolicy="no-referrer" alt={team.name} className="w-8 h-8 object-contain" />
        <span className="font-medium text-sm text-slate-200">{team.name}</span>
      </div>
      <div className="flex gap-1.5">
        {form.map((res, i) => (
          <div
            key={i}
            className={cn(
              "w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold border",
              res === 'W' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              res === 'L' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
              "bg-slate-500/10 border-slate-500/30 text-slate-400"
            )}
          >
            {res}
          </div>
        ))}
      </div>
    </div>
  );
}

// Pitch visualizer for tactical formations
function TacticalPitch({ teamName, formation, tactics }: { teamName: string; formation: string; tactics: string }) {
  // Simple layout mapping based on formation string
  // Default positions for 4-3-3: GK, 4 DEF, 3 MID, 3 FWD
  const getPlayersByFormation = (formStr: string) => {
    const parts = formStr.split('-').map(Number);
    const players: { x: number; y: number; role: string }[] = [];
    
    // Goalkeeper is constant
    players.push({ x: 50, y: 88, role: 'GK' });
    
    if (parts.length === 3) {
      // e.g. 4-3-3
      const [df, md, fw] = parts;
      // Defenders
      for (let i = 0; i < df; i++) {
        players.push({ x: 15 + (70 / (df - 1)) * i, y: 68, role: 'DEF' });
      }
      // Midfielders
      for (let i = 0; i < md; i++) {
        players.push({ x: 20 + (60 / (md - 1)) * i, y: 45, role: 'MID' });
      }
      // Forwards
      for (let i = 0; i < fw; i++) {
        players.push({ x: 15 + (70 / (fw - 1)) * i, y: 22, role: 'FWD' });
      }
    } else if (parts.length === 4) {
      // e.g. 4-2-3-1
      const [df, dm, am, fw] = parts;
      // Defenders
      for (let i = 0; i < df; i++) {
        players.push({ x: 15 + (70 / (df - 1)) * i, y: 72, role: 'DEF' });
      }
      // Defensive Mids
      for (let i = 0; i < dm; i++) {
        players.push({ x: 30 + (40 / (dm - 1)) * i, y: 56, role: 'MID' });
      }
      // Attacking Mids
      for (let i = 0; i < am; i++) {
        players.push({ x: 20 + (60 / (am - 1)) * i, y: 38, role: 'MID' });
      }
      // Forwards (ST)
      for (let i = 0; i < fw; i++) {
        players.push({ x: 50, y: 18, role: 'FWD' });
      }
    } else {
      // Fallback 4-4-2
      for (let i = 0; i < 4; i++) players.push({ x: 15 + (70 / 3) * i, y: 70, role: 'DEF' });
      for (let i = 0; i < 4; i++) players.push({ x: 15 + (70 / 3) * i, y: 45, role: 'MID' });
      for (let i = 0; i < 2; i++) players.push({ x: 35 + 30 * i, y: 20, role: 'FWD' });
    }
    return players;
  };

  const positions = getPlayersByFormation(formation);

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full aspect-[4/5] bg-emerald-950/40 border border-emerald-900/30 rounded-2xl overflow-hidden p-2 flex-1">
        {/* Pitch Lines */}
        <div className="absolute inset-0 border-2 border-emerald-800/10 m-2 rounded-lg" />
        <div className="absolute inset-x-2 top-2 h-[20%] border-b border-emerald-800/10 flex justify-center">
          <div className="w-[40%] h-full border-x border-emerald-850/10" />
        </div>
        <div className="absolute inset-x-2 bottom-2 h-[20%] border-t border-emerald-800/10 flex justify-center">
          <div className="w-[40%] h-full border-x border-emerald-850/10" />
        </div>
        <div className="absolute inset-x-0 h-[10px] top-[50%] -translate-y-[50%] border-t border-emerald-800/10" />
        <div className="absolute w-[30%] aspect-square rounded-full border border-emerald-800/10 left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]" />
        
        {/* Render Players */}
        {positions.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.03, type: "spring" }}
            className="absolute flex flex-col items-center -translate-x-[50%] -translate-y-[50%]"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[7px] sm:text-[9px] font-bold shadow-lg shadow-black/40 border",
              p.role === 'GK' ? "bg-amber-500/20 border-amber-500 text-amber-200" :
              p.role === 'DEF' ? "bg-blue-500/20 border-blue-500 text-blue-200" :
              p.role === 'MID' ? "bg-brand-primary/20 border-brand-primary text-brand-primary" :
              "bg-rose-500/20 border-rose-500 text-rose-200"
            )}>
              {p.role}
            </div>
          </motion.div>
        ))}

        <div className="absolute bottom-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-emerald-400 border border-emerald-500/20">
          {formation} FORMAT
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{teamName}</p>
        <p className="text-[10px] text-brand-secondary font-medium font-mono mt-0.5">{tactics}</p>
      </div>
    </div>
  );
}

// Side-by-side metric comparison bar
function MetricRow({ label, valA, valB, type = 'high-is-better' }: { label: string; valA: number; valB: number; type?: 'high-is-better' | 'low-is-better' }) {
  const sum = valA + valB;
  const pctA = sum === 0 ? 50 : (valA / sum) * 100;
  const pctB = sum === 0 ? 50 : (valB / sum) * 100;
  
  const isABetter = type === 'high-is-better' ? valA > valB : valA < valB;
  const isBBetter = type === 'high-is-better' ? valB > valA : valB < valA;

  return (
    <div className="space-y-1.5 py-3 border-b border-white/5 last:border-0">
      <div className="flex justify-between items-center text-xs">
        <span className={cn("font-bold font-mono", isABetter ? "text-brand-primary" : "text-slate-500")}>
          {valA.toFixed(label.includes('Avg') || label.includes('%') ? 1 : 0)}
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
        <span className={cn("font-bold font-mono", isBBetter ? "text-brand-secondary" : "text-slate-500")}>
          {valB.toFixed(label.includes('Avg') || label.includes('%') ? 1 : 0)}
        </span>
      </div>
      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
        <div 
          className={cn("h-full transition-all duration-500", isABetter ? "bg-brand-primary" : "bg-slate-500")}
          style={{ width: `${pctA}%` }}
        />
        <div 
          className={cn("h-full transition-all duration-500", isBBetter ? "bg-brand-secondary" : "bg-slate-600")}
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsPanel({ stats, teamA, teamB }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tactics' | 'squads'>('overview');

  // Provide robust backfalls to ensure no missing properties cause crashes
  const historical = stats.historicalStats || {
    teamA: { goalsScored: 24, goalsConceded: 18, possessionAvg: 52.8, cleanSheets: 9, yellowCards: 38, redCards: 1, seasonRecord: { wins: 15, draws: 6, losses: 7 } },
    teamB: { goalsScored: 21, goalsConceded: 20, possessionAvg: 48.2, cleanSheets: 7, yellowCards: 44, redCards: 2, seasonRecord: { wins: 12, draws: 8, losses: 8 } }
  };

  const tactical = stats.tacticalFormations || {
    teamA: { formation: "4-3-3", style: "Possession Attacking", keyTactics: ["High pressing", "Quick wing rotations", "Overlapping full-backs"] },
    teamB: { formation: "4-2-3-1", style: "Pacy Counter-Attack", keyTactics: ["Mid-block defense", "Rapid vertical transitions", "Target striker role"] }
  };

  const squads = stats.playerStats || {
    teamA: [
      { name: "Top Scorer", role: "Forward", rating: 7.8, goals: 11, assists: 3, status: "Healthy" },
      { name: "Playmaker", role: "Midfielder", rating: 7.5, goals: 3, assists: 7, status: "Healthy" },
      { name: "Defender Key", role: "Defender", rating: 7.2, goals: 1, assists: 0, status: "Healthy" }
    ],
    teamB: [
      { name: "Forward Lead", role: "Forward", rating: 7.6, goals: 9, assists: 2, status: "Healthy" },
      { name: "Creative Mid", role: "Midfielder", rating: 7.4, goals: 2, assists: 6, status: "Healthy" },
      { name: "Solid Center", role: "Defender", rating: 7.1, goals: 0, assists: 0, status: "Healthy" }
    ]
  };

  // Helper to identify the top 2-3 players based on rating and offensive metrics (goals, assists)
  const getTopPlayerIndices = (players: PlayerStat[]) => {
    return players
      .map((p, idx) => ({
        idx,
        score: p.rating * 10 + (p.goals || 0) * 2 + (p.assists || 0) * 1.5
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => item.idx);
  };

  const topAIndices = getTopPlayerIndices(squads.teamA);
  const topBIndices = getTopPlayerIndices(squads.teamB);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Compass },
    { id: 'history', name: 'History & Records', icon: History },
    { id: 'tactics', name: 'Tactical Styles', icon: Target },
    { id: 'squads', name: 'Squad Analytics', icon: Award }
  ] as const;

  return (
    <div className="space-y-6 mt-12">
      {/* Tabs list */}
      <div className="flex border-b border-white/5 overflow-x-auto pr-2 gap-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-display font-semibold text-xs whitespace-nowrap transition-all border-b-2 -mb-[2px]",
                isActive
                  ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon size={14} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Form */}
              <div className="glass-morphism rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-brand-primary" />
                  Recent Form
                </h3>
                <div className="space-y-2">
                  <FormRow team={teamA} form={stats.teamAForm} />
                  <FormRow team={teamB} form={stats.teamBForm} />
                </div>
              </div>

              {/* Head-to-Head */}
              <div className="glass-morphism rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                  <History size={18} className="text-brand-secondary" />
                  Head to Head Records
                </h3>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{teamA.shortName}</p>
                    <p className="text-3xl font-display font-bold text-brand-primary">{stats.h2h.teamAWins}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="text-[10px] font-bold text-slate-400 mb-1 leading-none text-center">
                      {stats.h2h.totalMatches} MATCHES • {stats.h2h.avgGoals} AVG GOALS
                    </div>
                    <div className="w-full flex h-1.5 rounded-full overflow-hidden bg-white/10 mb-2 mt-1">
                      <div 
                        className="h-full bg-brand-primary" 
                        style={{ width: `${(stats.h2h.teamAWins / Math.max(1, stats.h2h.totalMatches)) * 100}%` }} 
                      />
                      <div 
                        className="h-full bg-slate-500" 
                        style={{ width: `${(stats.h2h.draws / Math.max(1, stats.h2h.totalMatches)) * 100}%` }} 
                      />
                      <div 
                        className="h-full bg-brand-secondary" 
                        style={{ width: `${(stats.h2h.teamBWins / Math.max(1, stats.h2h.totalMatches)) * 100}%` }} 
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Draws: {stats.h2h.draws}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{teamB.shortName}</p>
                    <p className="text-3xl font-display font-bold text-brand-secondary">{stats.h2h.teamBWins}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {stats.h2h.lastResults.map((res, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono font-bold text-slate-400">
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match Atmosphere */}
              <div className="glass-morphism rounded-3xl p-6 lg:col-span-2">
                <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                  <Flag size={18} className="text-cyan-400" />
                  Match Info & Atmosphere
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/5">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Stadium</p>
                      <p className="font-display font-bold text-base text-slate-200">{stats.venue?.name || 'Main Stadium'}</p>
                      <p className="text-xs text-slate-400">{stats.venue?.city || 'Unknown City'} • Cap: {stats.venue?.capacity.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/5">
                      <User size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Referee</p>
                      <p className="font-display font-bold text-base text-slate-200">{stats.referee || 'TBA'}</p>
                      <p className="text-xs text-slate-400">Match Official</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/5">
                      <Users2 size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Expected Attendance</p>
                      <p className="font-display font-bold text-base text-slate-200">{stats.expectedAttendance?.toLocaleString() || 'Full Capacity'}</p>
                      <p className="text-xs text-slate-400">Projected Crowd</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-morphism rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-primary" />
                  Season Historical Stats Matchup
                </h3>
                <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded text-slate-400 font-bold uppercase tracking-wider">
                  Team Season Averages
                </span>
              </div>

              {/* Win, Draw, Loss Records */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Record Card */}
                <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 flex flex-col justify-between">
                  <div className="flex gap-2 items-center mb-4">
                    <img src={teamA.logo} referrerPolicy="no-referrer" alt={teamA.name} className="w-6 h-6 object-contain" />
                    <span className="text-sm font-bold text-slate-300">{teamA.shortName} Season Record</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">WINS</p>
                      <p className="text-xl font-display font-bold">{historical.teamA.seasonRecord.wins}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">DRAWS</p>
                      <p className="text-xl font-display font-bold">{historical.teamA.seasonRecord.draws}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-rose-400 uppercase">LOSSES</p>
                      <p className="text-xl font-display font-bold">{historical.teamA.seasonRecord.losses}</p>
                    </div>
                  </div>
                </div>

                {/* Team B Record Card */}
                <div className="p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/10 flex flex-col justify-between">
                  <div className="flex gap-2 items-center mb-4">
                    <img src={teamB.logo} referrerPolicy="no-referrer" alt={teamB.name} className="w-6 h-6 object-contain" />
                    <span className="text-sm font-bold text-slate-300">{teamB.shortName} Season Record</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">WINS</p>
                      <p className="text-xl font-display font-bold">{historical.teamB.seasonRecord.wins}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">DRAWS</p>
                      <p className="text-xl font-display font-bold">{historical.teamB.seasonRecord.draws}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-bold text-rose-400 uppercase">LOSSES</p>
                      <p className="text-xl font-display font-bold">{historical.teamB.seasonRecord.losses}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric comparative rows */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <MetricRow label="Goals Scored" valA={historical.teamA.goalsScored} valB={historical.teamB.goalsScored} />
                <MetricRow label="Goals Conceded" valA={historical.teamA.goalsConceded} valB={historical.teamB.goalsConceded} type="low-is-better" />
                <MetricRow label="Average Possession %" valA={historical.teamA.possessionAvg} valB={historical.teamB.possessionAvg} />
                <MetricRow label="Clean Sheets" valA={historical.teamA.cleanSheets} valB={historical.teamB.cleanSheets} />
                <MetricRow label="Yellow Cards" valA={historical.teamA.yellowCards} valB={historical.teamB.yellowCards} type="low-is-better" />
                <MetricRow label="Red Cards" valA={historical.teamA.redCards} valB={historical.teamB.redCards} type="low-is-better" />
              </div>
            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="glass-morphism rounded-3xl p-6 space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Tactical Formations & Styles
                </h3>
                <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded text-amber-300 font-bold uppercase tracking-wider">
                  Digital Pitchboard
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Team A Formation */}
                <TacticalPitch 
                  teamName={teamA.name} 
                  formation={tactical.teamA.formation} 
                  tactics={tactical.teamA.style} 
                />

                {/* Team B Formation */}
                <TacticalPitch 
                  teamName={teamB.name} 
                  formation={tactical.teamB.formation} 
                  tactics={tactical.teamB.style} 
                />
              </div>

              {/* Key Tactical Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">{teamA.shortName} Key Battle Strategies</p>
                  <ul className="space-y-2">
                    {tactical.teamA.keyTactics.map((t, i) => (
                      <li key={i} className="flex gap-2 items-start text-xs text-slate-400">
                        <span className="text-brand-primary pt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-brand-secondary uppercase tracking-widest">{teamB.shortName} Key Battle Strategies</p>
                  <ul className="space-y-2">
                    {tactical.teamB.keyTactics.map((t, i) => (
                      <li key={i} className="flex gap-2 items-start text-xs text-slate-400">
                        <span className="text-brand-secondary pt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'squads' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team A Squad */}
              <div className="glass-morphism rounded-3xl p-6">
                <div className="flex gap-3 items-center mb-6">
                  <img src={teamA.logo} referrerPolicy="no-referrer" alt={teamA.name} className="w-6 h-6 object-contain" />
                  <h3 className="font-display font-bold text-lg text-slate-200">{teamA.name} Essential Players</h3>
                </div>

                <div className="space-y-4">
                  {squads.teamA.map((player, idx) => {
                    const isKeyPlayer = topAIndices.includes(idx);
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-3 rounded-2xl flex items-center justify-between gap-4 border transition-all duration-300 relative overflow-hidden",
                          isKeyPlayer 
                            ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.08)]" 
                            : "bg-white/5 border-white/5"
                        )}
                      >
                        {isKeyPlayer && (
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-tr from-transparent via-amber-500/5 to-amber-500/15 rounded-tr-2xl pointer-events-none" />
                        )}
                        <div className="space-y-1 relative z-10">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isKeyPlayer && (
                              <Crown size={12} className="text-amber-400 fill-amber-400/20 shrink-0 animate-pulse" />
                            )}
                            <span className={cn("text-sm font-bold", isKeyPlayer ? "text-amber-200" : "text-slate-300")}>
                              {player.name}
                            </span>
                            {isKeyPlayer && (
                              <span className="text-[8px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                                Key Player
                              </span>
                            )}
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider",
                              player.status === 'Healthy' ? "bg-emerald-500/10 text-emerald-400" :
                              player.status === 'Injured' ? "bg-rose-500/10 text-rose-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {player.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                            <span>{player.role}</span>
                            {player.goals !== undefined && player.goals > 0 && (
                              <span className="text-slate-500">{player.goals} Goals</span>
                            )}
                            {player.assists !== undefined && player.assists > 0 && (
                              <span className="text-slate-500">{player.assists} Assists</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right relative z-10">
                          <div className="text-xs text-slate-500 font-bold mb-0.5">Rating</div>
                          <div className={cn(
                            "text-base font-display font-bold font-mono px-2 py-0.5 rounded-lg inline-block border transition-all duration-300",
                            isKeyPlayer 
                              ? "text-amber-400 bg-amber-500/20 border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                              : "text-brand-primary bg-brand-primary/10 border-brand-primary/20"
                          )}>
                            {player.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team B Squad */}
              <div className="glass-morphism rounded-3xl p-6">
                <div className="flex gap-3 items-center mb-6">
                  <img src={teamB.logo} referrerPolicy="no-referrer" alt={teamB.name} className="w-6 h-6 object-contain" />
                  <h3 className="font-display font-bold text-lg text-slate-200">{teamB.name} Essential Players</h3>
                </div>

                <div className="space-y-4">
                  {squads.teamB.map((player, idx) => {
                    const isKeyPlayer = topBIndices.includes(idx);
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-3 rounded-2xl flex items-center justify-between gap-4 border transition-all duration-300 relative overflow-hidden",
                          isKeyPlayer 
                            ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.08)]" 
                            : "bg-white/5 border-white/5"
                        )}
                      >
                        {isKeyPlayer && (
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-tr from-transparent via-amber-500/5 to-amber-500/15 rounded-tr-2xl pointer-events-none" />
                        )}
                        <div className="space-y-1 relative z-10">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isKeyPlayer && (
                              <Crown size={12} className="text-amber-400 fill-amber-400/20 shrink-0 animate-pulse" />
                            )}
                            <span className={cn("text-sm font-bold", isKeyPlayer ? "text-amber-200" : "text-slate-300")}>
                              {player.name}
                            </span>
                            {isKeyPlayer && (
                              <span className="text-[8px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                                Key Player
                              </span>
                            )}
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider",
                              player.status === 'Healthy' ? "bg-emerald-500/10 text-emerald-400" :
                              player.status === 'Injured' ? "bg-rose-500/10 text-rose-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {player.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                            <span>{player.role}</span>
                            {player.goals !== undefined && player.goals > 0 && (
                              <span className="text-slate-500">{player.goals} Goals</span>
                            )}
                            {player.assists !== undefined && player.assists > 0 && (
                              <span className="text-slate-500">{player.assists} Assists</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right relative z-10">
                          <div className="text-xs text-slate-500 font-bold mb-0.5">Rating</div>
                          <div className={cn(
                            "text-base font-display font-bold font-mono px-2 py-0.5 rounded-lg inline-block border transition-all duration-300",
                            isKeyPlayer 
                              ? "text-amber-400 bg-amber-500/20 border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                              : "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20"
                          )}>
                            {player.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
