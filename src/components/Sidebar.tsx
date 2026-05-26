import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Globe, History, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-brand-primary/10 text-brand-primary" 
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={20} className={cn("transition-transform duration-200 group-hover:scale-110", active && "text-brand-primary")} />
      <span className="font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />}
    </button>
  );
}

export default function Sidebar() {
  const [active, setActive] = React.useState('Predictions');
  const [history, setHistory] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = React.useCallback(() => {
    try {
      const data = JSON.parse(localStorage.getItem('match_history') || '[]');
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, [loadHistory]);

  return (
    <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <Trophy className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl leading-none">SXA TIPS</h1>
          <p className="text-[10px] text-brand-primary font-bold tracking-widest uppercase">Football26</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={active === 'Dashboard'} onClick={() => setActive('Dashboard')} />
        <SidebarItem icon={Globe} label="Leagues" active={active === 'Leagues'} onClick={() => setActive('Leagues')} />
        <SidebarItem icon={History} label="History" active={active === 'History'} onClick={() => setActive('History')} />
        
        {active === 'History' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-2 space-y-2"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Matches</p>
            {history.length > 0 ? (
              history.map((m, i) => (
                <div key={m.id || i} className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-brand-primary font-bold">{m.prediction?.correctScore}</span>
                    <span className="text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] font-medium truncate">{m.teamA.name} vs {m.teamB.name}</p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-600 italic">No history yet</p>
            )}
          </motion.div>
        )}
      </nav>

      <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
        {user ? (
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border border-white/10" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <button 
                onClick={() => signOut(auth)}
                className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <LogOut size={10} /> Logout
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <LogIn size={16} />
            </div>
            <span className="text-xs font-bold">Sign in with Google</span>
          </button>
        )}

        <div className="glass-morphism rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-2">Confidence Score</p>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="h-full bg-brand-primary" 
            />
          </div>
          <p className="text-[10px] text-brand-primary mt-2 font-semibold">AI Models Optimized</p>
        </div>
      </div>
    </aside>
  );
}
