import React, { useEffect, useState } from 'react';
import { Bot, Search, Plus, Play, Pause, PowerOff, X, Sparkles, BrainCircuit, ShieldCheck, HeadphonesIcon } from 'lucide-react';
import { AgentMetricsDashboard } from './AgentMetricsDashboard';
import { TokenBudgetSummary } from './TokenBudgetSummary';
import { toast } from '../lib/toast';

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'offline';
  type: string;
  description: string;
  currentTask?: string | null;
  capabilities?: string[];
}

const AGENT_TEMPLATES = [
  {
    name: 'Data Analyst',
    type: 'analytical',
    description: 'Specializes in SQL, data extraction and visual reporting. Ideal for generating insights from raw database dumps.',
    icon: <BrainCircuit className="text-white" size={24} />,
    color: 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 border border-blue-400',
  },
  {
    name: 'Customer Support Rep',
    type: 'support',
    description: 'Handles ticket triaging, refund processing, and notifications. Integrates with Zendesk and Slack.',
    icon: <HeadphonesIcon className="text-white" size={24} />,
    color: 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30 border border-purple-400',
  },
  {
    name: 'Research Planner',
    type: 'planning',
    description: 'Performs deep web research and constructs execution plans before delegating to other agents.',
    icon: <Sparkles className="text-white" size={24} />,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/30 border border-indigo-400',
  },
  {
    name: 'Compliance / QA',
    type: 'validation',
    description: 'Verifies the integrity and safety of execution payloads before they are dispatched to live systems.',
    icon: <ShieldCheck className="text-white" size={24} />,
    color: 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30 border border-rose-400',
  }
];

interface AgentRegistryProps {
  onTutorialProgress?: (action: string) => void;
}

export function AgentRegistry({ onTutorialProgress }: AgentRegistryProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const fetchAgents = () => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const deployAgent = async (template: typeof AGENT_TEMPLATES[0]) => {
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          description: template.description
        })
      });
      fetchAgents();
      setIsDeploying(false);
      toast('Agent Deployed', `Successfully deployed cognitive fleet agent: ${template.name}`, 'success');
      if (onTutorialProgress) {
        onTutorialProgress('agent_deploy');
      }
    } catch(err) {
      console.error(err);
      toast('Deployment Failed', 'Could not deploy selected agent template.', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'offline': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <Pause size={12} className="mr-1" />;
      case 'active': return <Play size={12} className="mr-1" />;
      case 'offline': return <PowerOff size={12} className="mr-1" />;
      default: return <PowerOff size={12} className="mr-1" />;
    }
  };

  const getAgentTypeStyle = (type: string) => {
    switch (type) {
      case 'analytical': return 'bg-blue-100 text-blue-700';
      case 'support': return 'bg-purple-100 text-purple-700';
      case 'planning': return 'bg-indigo-100 text-indigo-700';
      case 'validation': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {selectedAgent ? (
          <AgentMetricsDashboard agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
        ) : (
          <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-150/40 pb-4">
               <div>
                 <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                   <div className="bg-sky-500 text-white p-2 rounded-xl shadow-lg shadow-sky-500/20">
                     <Bot size={24} />
                   </div>
                   AI Agents
                 </h1>
                 <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Manage specialized AI agents and monitor their active execution lifecycle.</p>
               </div>
               
               <button 
                  onClick={() => setIsDeploying(true)}
                  className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-500/15 transition-all text-sm"
               >
                  <Plus size={18} /> Deploy Agent
               </button>
            </header>

            <TokenBudgetSummary />

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search agents..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <select className="bg-white dark:bg-slate-800 border border-slate-200 rounded-lg px-4 py-2 outline-none text-slate-600 dark:text-slate-400 font-medium">
                     <option>All Status</option>
                     <option>Active</option>
                     <option>Idle</option>
                     <option>Offline</option>
                  </select>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium">Loading agents...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {agents.map((agent) => (
                        <div key={agent.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white dark:bg-slate-800 group flex flex-col">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400">
                                    <Bot className="text-white" size={24} />
                                 </div>
                                 <div>
                                   <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{agent.name}</h3>
                                   <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getAgentTypeStyle(agent.type)}`}>
                                     {agent.type}
                                   </span>
                                 </div>
                              </div>
                              
                              <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center border ${getStatusColor(agent.status)}`}>
                                 {getStatusIcon(agent.status)}
                                 {agent.status}
                              </div>
                           </div>
                           
                           <p className="text-slate-600 dark:text-slate-400 mb-4 flex-1 text-sm">{agent.description}</p>
                           
                           {agent.capabilities && agent.capabilities.length > 0 && (
                             <div className="flex flex-wrap gap-2 mb-4">
                               {agent.capabilities.map((cap, i) => (
                                 <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">
                                   {cap}
                                 </span>
                               ))}
                             </div>
                           )}

                           <div className="mb-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-700 min-h-[60px]">
                              <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">Current Task</span>
                              {agent.status === 'active' && agent.currentTask ? (
                                <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                  {agent.currentTask}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400 italic">No active task</span>
                              )}
                           </div>
                           
                           <div className="flex items-center gap-4 pt-4 border-t border-slate-100 justify-between">
                              <div className="text-xs font-bold text-slate-400 uppercase">
                                 <span>ID: {agent.id}</span>
                              </div>
                              <button onClick={() => setSelectedAgent(agent)} className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors">
                                View Metrics
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </>
        )}
      </div>

      {isDeploying && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Deploy New Agent</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a pre-defined agent template to instantiate.</p>
              </div>
              <button 
                onClick={() => setIsDeploying(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
               >
                 <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {AGENT_TEMPLATES.map((template) => (
                <div 
                  key={template.name}
                  className="border border-slate-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col group bg-white dark:bg-slate-800 relative"
                  onClick={() => deployAgent(template)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${template.color}`}>
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-blue-600 transition-colors">{template.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">{template.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 mt-auto flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Template</span>
                    <button className="text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Deploy Now →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
