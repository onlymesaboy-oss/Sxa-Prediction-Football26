import { motion } from 'motion/react';
import { Target, TrendingUp, Shield, Users, Timer, Sparkles, MapPin, Clock, FileDown } from 'lucide-react';
import { Prediction, Team, MatchStats, MatchSession } from '../types';
import { cn } from '../lib/utils';
import { generatePdfReport } from '../utils/pdfGenerator';

interface PredictionCardProps {
  prediction: Prediction;
  teamA: Team;
  teamB: Team;
  stats?: MatchStats;
  session?: MatchSession;
}

function StatItem({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string, colorClass: string }) {
  return (
    <div className="glass-morphism rounded-2xl p-5 prediction-card-hover group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg bg-opacity-10", colorClass.replace('text', 'bg'))}>
          <Icon size={20} className={colorClass} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-display font-bold">{value}</span>
        <Sparkles size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
    </div>
  );
}

export default function PredictionPanel({ prediction, teamA, teamB, stats, session }: PredictionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Match Meta Information */}
      <div className="flex flex-wrap gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card border border-white/5 shadow-sm">
          <MapPin size={14} className="text-brand-primary" />
          <span className="text-xs font-bold text-slate-300">
            {stats?.venue?.name ? `${stats.venue.name}, ${stats.venue.city}` : 'Stadium: Loading...'}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card border border-white/5 shadow-sm">
          <Clock size={14} className="text-brand-secondary" />
          <span className="text-xs font-bold text-slate-300">
            Kickoff: {stats?.actualStartTime || 'Searching real-time data...'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display font-bold text-2xl flex items-center gap-2">
            AI Analysis Results
            <span className="px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary text-xs font-bold font-sans animate-pulse">LIVE</span>
          </h3>
          {session && (
            <button
              onClick={() => generatePdfReport(session)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-bg-deep border border-brand-primary/30 font-sans text-xs font-bold active:scale-95 transition-all duration-300 cursor-pointer shadow-lg shadow-brand-primary/5 hover:shadow-brand-primary/20"
            >
              <FileDown size={14} />
              <span>Download Report (PDF)</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Confidence</p>
            <p className="text-lg font-display font-bold text-brand-primary">{prediction.confidence}%</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-brand-primary"
                strokeDasharray="125.6"
                style={{ strokeDashoffset: 125.6 - (125.6 * prediction.confidence) / 100 }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatItem icon={Target} label="Correct Score" value={prediction.correctScore} colorClass="text-brand-primary" />
        <StatItem icon={TrendingUp} label="Goals Line (O/U)" value={prediction.overUnder} colorClass="text-brand-secondary" />
        <StatItem icon={Shield} label="Asian Handicap" value={prediction.handicap} colorClass="text-brand-accent" />
        <StatItem icon={Users} label="BTTS" value={prediction.btts} colorClass="text-pink-500" />
        <StatItem icon={Timer} label="Half-Time" value={prediction.halfTime} colorClass="text-purple-500" />
        <StatItem icon={Sparkles} label="Corners" value={prediction.corners} colorClass="text-cyan-500" />
      </div>

      <div className="glass-morphism rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <h4 className="font-display font-bold text-lg mb-3 text-brand-primary">ការវិភាគរបស់អ្នកជំនាញ</h4>
        <p className="text-slate-400 leading-relaxed text-sm italic">
           "{prediction.reasoning}"
        </p>
      </div>

      {prediction.marketOdds && (
        <div className="glass-morphism rounded-3xl p-6 border border-brand-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <h4 className="font-display font-bold text-lg text-white">Live Market Consensus</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Source: {prediction.marketOdds.source}</p>
            </div>
            <div className="self-start md:self-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase">Real-Time Odds</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1x2 Odds</span>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[9px] text-slate-500 mb-1 uppercase">Home</p>
                  <p className="font-bold text-brand-primary">{prediction.marketOdds.oneXTwo.home.toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[9px] text-slate-500 mb-1 uppercase">Draw</p>
                  <p className="font-bold text-slate-300">{prediction.marketOdds.oneXTwo.draw.toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[9px] text-slate-500 mb-1 uppercase">Away</p>
                  <p className="font-bold text-brand-secondary">{prediction.marketOdds.oneXTwo.away.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Market Goals line</span>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-brand-secondary/10">
                    <TrendingUp size={16} className="text-brand-secondary" />
                  </div>
                  <span className="font-bold text-base">{prediction.marketOdds.overUnder}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">AI Pick</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    prediction.overUnder === prediction.marketOdds.overUnder 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-brand-secondary/10 text-brand-secondary"
                  )}>
                    {prediction.overUnder}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Market Handicap</span>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                <div className="flex items-center justify-between ">
                  <div className="p-1.5 rounded-lg bg-brand-accent/10">
                    <Shield size={16} className="text-brand-accent" />
                  </div>
                  <span className="font-bold text-base">{prediction.marketOdds.handicap}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">AI Pick</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    prediction.handicap.includes(prediction.marketOdds.handicap) 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-brand-primary/10 text-brand-primary"
                  )}>
                    {prediction.handicap}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
