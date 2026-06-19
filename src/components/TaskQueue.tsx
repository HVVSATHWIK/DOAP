import React, { useEffect, useState } from 'react';
import { Play, Activity, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Flag, GripVertical } from 'lucide-react';
import { GraphVisualization } from './GraphVisualization';

interface Task {
  id: string;
  title: string;
  intent: string;
  status: 'planning' | 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  plan: any[] | null;
  activeStepIndex: number;
  createdAt: number;
  error?: string;
  priority?: number;
}

export function TaskQueue() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [intentInput, setIntentInput] = useState('');
  const [routingMode, setRoutingMode] = useState<'default' | 'fast' | 'thinking' | 'grounded' | 'maps'>('default');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const dispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentInput.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentInput, routingMode })
      });
      setIntentInput('');
      fetchTasks();
    } catch(err) {
    } finally {
      setLoading(false);
    }
  };

  const approveTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/tasks/${id}/approve`, { method: 'POST' });
      fetchTasks();
    } catch(err) {}
  };

  const togglePriority = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPriority = (task.priority || 0) > 0 ? 0 : 100;
    try {
      await fetch(`/api/tasks/${task.id}/priority`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });
      fetchTasks();
    } catch(err) {}
  };

  const handleDragStart = (id: string) => {
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedTaskId === id) return;
    setDragOverTaskId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const targetTask = tasks.find(t => t.id === targetId);
    if (!targetTask) return;

    const newPriority = (targetTask.priority || 0) + 1;
    setDragOverTaskId(null);
    setDraggedTaskId(null);

    // Optimistically reorder Locally for snappy feel
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (draggedTask) {
        draggedTask.priority = newPriority;
        setTasks([...tasks].sort((a,b) => (b.priority || 0) - (a.priority || 0) || b.createdAt - a.createdAt));
    }

    try {
      await fetch(`/api/tasks/${draggedTaskId}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });
      fetchTasks();
    } catch(err) {}
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'planning': return 'text-indigo-600 bg-indigo-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
    }
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  const toggleSelectTask = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(prev => prev.filter(tId => tId !== id));
    } else {
      setSelectedTaskIds(prev => [...prev, id]);
    }
  };

  const handleBulkAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskIds: selectedTaskIds })
      });
      setSelectedTaskIds([]);
      fetchTasks();
    } catch(err) {} finally {
      setIsBulkActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative p-8">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
        <header className="mb-8">
           <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-4">
             <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400">
               <Activity className="text-white" size={26} />
             </div>
             Execution Logs & Task Queue
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Monitor orchestrator cycles, inspect dynamic plans, and resolve Human-in-the-Loop tasks.</p>
        </header>

        {/* Dispatch Form */}
        <form onSubmit={dispatchTask} className="mb-8 relative z-10 shadow-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 p-4 flex flex-col gap-4">
           <div className="flex gap-4 items-center">
             <select 
               value={routingMode} 
               onChange={(e) => setRoutingMode(e.target.value as any)}
               className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 bg-white dark:bg-slate-800 transition-colors"
             >
               <option value="default">Default Model</option>
               <option value="fast">Flash-Lite</option>
               <option value="thinking">Pro (Thinking)</option>
               <option value="grounded">Search Grounded</option>
               <option value="maps">Maps Grounded</option>
             </select>
             <input
               type="text"
               value={intentInput}
               onChange={(e) => setIntentInput(e.target.value)}
               placeholder="Dispatch a new natural language intent..."
               className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 py-3 rounded-lg px-4 outline-none focus:border-blue-500 transition-colors"
             />
             <button type="submit" disabled={loading || !intentInput} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:bg-slate-400">
               <Play size={18} /> Dispatch
             </button>
           </div>
           
           {intentInput.trim().length > 0 && (
             <div className="flex gap-6 mt-1 px-2 pb-1 text-sm border-t border-slate-100 dark:border-slate-700/50 pt-3">
                <div className="flex items-center gap-2 text-slate-500">
                   <Activity size={15} className="text-blue-500" />
                   <span>Est. Tokens: <strong className="text-slate-700 dark:text-slate-300">{Math.ceil(intentInput.trim().split(/\s+/).filter(Boolean).length * 1.5) + 50}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                   <Play size={15} className="text-emerald-500" />
                   <span>Predicted Cost: <strong className="text-slate-700 dark:text-slate-300">${((Math.ceil(intentInput.trim().split(/\s+/).filter(Boolean).length * 1.5) + 50) * 0.00002).toFixed(5)}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                   <Clock size={15} className="text-purple-500" />
                   <span>Est. Runtime: <strong className="text-slate-700 dark:text-slate-300">{(2 + Math.min(10, intentInput.trim().split(/\s+/).length * 0.2)).toFixed(1)}s</strong></span>
                </div>
             </div>
           )}
        </form>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-300">Active Pipeline</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag and drop tasks to reorder priority, or click the flag to toggle high priority.</p>
             </div>
             {tasks.length > 0 && (
               <div className="flex items-center gap-3">
                 <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                   <input type="checkbox" checked={selectedTaskIds.length === tasks.length && tasks.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                   Select All
                 </label>
                 
                 {selectedTaskIds.length > 0 && (
                   <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                     <button disabled={isBulkActionLoading} onClick={() => handleBulkAction('pause')} className="px-3 py-1.5 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">Pause</button>
                     <button disabled={isBulkActionLoading} onClick={() => handleBulkAction('resume')} className="px-3 py-1.5 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">Resume</button>
                     <button disabled={isBulkActionLoading} onClick={() => handleBulkAction('cancel')} className="px-3 py-1.5 text-sm font-bold bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50">Cancel</button>
                   </div>
                 )}
               </div>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {tasks.map(task => (
               <div 
                 key={task.id} 
                 draggable
                 onDragStart={() => handleDragStart(task.id)}
                 onDragOver={(e) => handleDragOver(e, task.id)}
                 onDrop={(e) => handleDrop(e, task.id)}
                 onDragEnd={() => { setDragOverTaskId(null); setDraggedTaskId(null); }}
                 className={`border rounded-xl overflow-hidden shadow-sm transition-colors cursor-move
                    ${expandedId === task.id ? 'border-blue-300' : 'border-slate-200'}
                    ${dragOverTaskId === task.id ? 'border-t-4 border-t-blue-500' : ''}
                    ${task.priority && task.priority > 0 ? 'bg-amber-50/30' : 'bg-white dark:bg-slate-800'}
                 `}
               >
                  <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
                     <div className="flex items-center gap-4">
                        <GripVertical className="text-slate-300 cursor-grab active:cursor-grabbing" size={20} />
                        <div className="flex items-center justify-center mr-2" onClick={(e) => e.stopPropagation()}>
                           <input type="checkbox" checked={selectedTaskIds.includes(task.id)} onChange={(e) => toggleSelectTask(task.id, e)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                          {task.status}
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                             {task.title}
                           </h4>
                           <div className="text-xs text-slate-400 mt-1">{task.id} • {new Date(task.createdAt).toLocaleTimeString()}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => togglePriority(task, e)} 
                          className={`p-2 rounded-full transition-colors ${task.priority && task.priority > 0 ? 'text-amber-500 bg-amber-100' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500'}`}
                          title="Toggle Priority"
                        >
                           <Flag size={18} fill={task.priority && task.priority > 0 ? "currentColor" : "none"} />
                        </button>
                        {task.status === 'paused' && (
                           <button onClick={(e) => approveTask(task.id, e)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm flex items-center gap-2">
                             <ShieldAlert size={14} /> Approve Action
                           </button>
                        )}
                        <span className="text-slate-400 font-medium text-sm border-l border-slate-200 pl-4 ml-2">
                           {task.plan ? `${Math.min(task.activeStepIndex, task.plan.length)}/${task.plan.length} steps` : 'Planning...'} 
                        </span>
                     </div>
                  </div>
                  
                  {expandedId === task.id && task.plan && task.plan.length > 0 && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200">
                       <GraphVisualization plan={task.plan} activeStepIndex={task.activeStepIndex} />
                       
                       <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {task.plan.map((step, idx) => (
                             <div key={idx} className={`bg-white dark:bg-slate-800 p-4 rounded-lg border ${task.activeStepIndex === idx ? 'border-blue-400 ring-1 ring-blue-100 shadow-md' : 'border-slate-200'} ${task.activeStepIndex > idx ? 'opacity-50' : ''}`}>
                                <div className="text-xs font-bold text-slate-400 mb-1">Step {idx + 1}</div>
                                <h5 className={`font-bold text-slate-800 dark:text-slate-100 mb-2 ${task.activeStepIndex === idx ? 'text-blue-700' : ''}`}>{step.toolName}</h5>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{step.rationale}</p>
                                {step.humanApprovalRequired && (
                                   <div className="inline-block bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                     Requires Approval
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
             ))}
             {tasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner border border-slate-300 dark:border-slate-700">
                      <Activity size={40} className="text-slate-400 dark:text-slate-500" />
                   </div>
                   <span className="font-medium">No execution tasks found. Dispatch a payload above to begin.</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
