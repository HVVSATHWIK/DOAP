import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ArrowLeft, Clock, Zap, Cpu } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
}

interface AgentMetricsDashboardProps {
  agent: Agent;
  onBack: () => void;
}

interface Metric {
  date: string;
  latency: number;
  successRate: number;
  tokens: number;
}

export function AgentMetricsDashboard({ agent, onBack }: AgentMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}/metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data.metrics || []);
        setLoading(false);
      });
  }, [agent.id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Loading telemetry...</p>
      </div>
    );
  }

  const avgLatency = Math.round(metrics.reduce((acc, m) => acc + m.latency, 0) / metrics.length);
  const avgSuccess = Math.round(metrics.reduce((acc, m) => acc + m.successRate, 0) / metrics.length * 10) / 10;
  const totalTokens = Math.round(metrics.reduce((acc, m) => acc + m.tokens, 0));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{agent.name} Metrics</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">ID: {agent.id} • Type: {agent.type}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-400 uppercase">Avg Latency</p>
               <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{avgLatency}ms</p>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
               <Zap size={24} />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-400 uppercase">Success Rate</p>
               <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{avgSuccess}%</p>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
               <Cpu size={24} />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-400 uppercase">Total Tokens</p>
               <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalTokens.toLocaleString()}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6">Latency Trend (ms)</h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                       contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6">Execution Success Rate (%)</h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 100]} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                       contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6">Token Consumption</h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                       contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="tokens" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
