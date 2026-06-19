import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, AlertCircle, Coins, ArrowUpRight, TrendingUp } from 'lucide-react';
import { toast } from '../lib/toast';

interface AgentTokenSummary {
  id: string;
  name: string;
  status: string;
  tokensUsed: number;
  budgetLimit: number;
}

interface TokenSummaryData {
  totalTokens: number;
  totalBudget: number;
  agents: AgentTokenSummary[];
}

export function TokenBudgetSummary() {
  const [data, setData] = useState<TokenSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/token-summary');
      const result = await res.json();
      setData(result);
      
      // Check for approaching limits, if any cross 90%
      const approaching = result.agents.filter((a: AgentTokenSummary) => (a.tokensUsed / a.budgetLimit) > 0.9);
      if (approaching.length > 0) {
         // Show a generic warning or toast
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 flex justify-center items-center h-32">
      <div className="animate-pulse flex gap-2 items-center text-slate-400">
         <Activity size={20} /> Loading Token Governance...
      </div>
    </div>
  );

  if (!data) return null;

  const totalUtilization = Math.min(100, Math.round((data.totalTokens / data.totalBudget) * 100)) || 0;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
           <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-sm border border-blue-400">
             <Coins className="text-white" size={18} />
           </div>
           Token Governance & Budgeting
        </h2>
        <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
           <Activity size={14} className="text-blue-500" /> Live Feed
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Consumption</div>
            <div className="text-3xl font-display font-medium text-slate-900 dark:text-white flex items-end gap-2">
               {data.totalTokens.toLocaleString()} <span className="text-base text-slate-400 font-normal mb-1">tokens</span>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Global Limit</div>
            <div className="text-3xl font-display font-medium text-slate-900 dark:text-white flex items-end gap-2">
               {data.totalBudget.toLocaleString()} <span className="text-base text-slate-400 font-normal mb-1">tokens</span>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Utilization</div>
             <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${totalUtilization > 85 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${totalUtilization}%` }}></div>
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {totalUtilization}%
                </div>
             </div>
         </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700/50 pt-6">
         <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" /> Active Agent Expenditure
         </h3>
         
         <div className="space-y-4">
           {data.agents.map(agent => {
              const utilization = Math.min(100, Math.round((agent.tokensUsed / agent.budgetLimit) * 100));
              const isWarning = utilization >= 80 && utilization < 95;
              const isCritical = utilization >= 95;
              
              return (
                <div key={agent.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="sm:w-1/4">
                     <div className="font-bold text-slate-900 dark:text-white truncate">{agent.name}</div>
                     <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{agent.id}</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                       <span>{agent.tokensUsed.toLocaleString()} / {agent.budgetLimit.toLocaleString()} tkns</span>
                       <span className={isCritical ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-500 font-bold' : ''}>
                          {utilization}%
                       </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${
                            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                         }`} 
                         style={{ width: `${utilization}%` }}
                       ></div>
                    </div>
                  </div>
                  
                  <div className="sm:w-1/6 flex justify-end">
                     {isCritical ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                          <AlertCircle size={14} /> LIMIT REACHED
                        </div>
                     ) : isWarning ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          <AlertTriangle size={14} /> APPROACHING
                        </div>
                     ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          <Activity size={14} /> HEALTHY
                        </div>
                     )}
                  </div>
                </div>
              );
           })}
         </div>
      </div>
    </div>
  );
}
