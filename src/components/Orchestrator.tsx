import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Cpu, CheckCircle2, AlertTriangle, Workflow, Play, ShieldAlert, ArrowRight, LayoutGrid, Sliders } from 'lucide-react';
import { GraphVisualization } from './GraphVisualization';
import { VisualWorkflowCanvas, VisualStep } from './VisualWorkflowCanvas';

interface Step {
  id: string;
  toolName: string;
  rationale: string;
  mockPayload: string;
  humanApprovalRequired: boolean;
}

export function Orchestrator({ onTutorialProgress }: { onTutorialProgress?: (action: string) => void }) {
  const [activeMode, setActiveMode] = useState<'auto' | 'canvas'>('auto');
  const [canvasPreloadSteps, setCanvasPreloadSteps] = useState<VisualStep[] | undefined>(undefined);
  const [intent, setIntent] = useState('');
  const [routingMode, setRoutingMode] = useState<'default' | 'fast' | 'thinking' | 'grounded' | 'maps'>('default');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Step[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  
  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;
    
    setLoading(true);
    setPlan(null);
    setError(null);
    setActiveStepIndex(-1);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, routingMode })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setPlan(data.workflow);
      if (onTutorialProgress) {
        onTutorialProgress('plan_orchestrated');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executePlan = () => {
    if (!plan) return;
    setActiveStepIndex(0);
    // basic simulation
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= plan.length) {
        clearInterval(interval);
      } else {
        // Stop simulation if human approval needed
        if (plan[current - 1] && plan[current - 1].humanApprovalRequired) {
          clearInterval(interval);
        } else {
          setActiveStepIndex(current);
        }
      }
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-150/40 pb-4 mb-6">
           <div>
             <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
               <div className="bg-sky-500 text-white p-2 rounded-xl shadow-lg shadow-sky-500/20">
                 <Workflow size={24} />
               </div>
               Agentic Planning & Layout
             </h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Orchestrate systems with automatic AI intent-driven pathways or manual canvas constructors.</p>
           </div>

           {/* Mode Selection Pill Header bar */}
           <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-sky-100 dark:border-slate-800 self-start md:self-center">
             <button
               onClick={() => {
                 setActiveMode('auto');
               }}
               className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                 activeMode === 'auto'
                   ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm'
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Sliders size={13} />
               AI Intent Planner
             </button>
             <button
               onClick={() => {
                 setActiveMode('canvas');
               }}
               className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                 activeMode === 'canvas'
                   ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm'
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <LayoutGrid size={13} />
               Interactive Canvas
             </button>
           </div>
        </header>

        {/* Separator line removed for better flow */}

        {activeMode === 'auto' ? (
          <>
            {/* Input Area */}
            <form onSubmit={generatePlan} className="mb-10 relative z-10 shadow-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200">
               <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl border-b border-slate-100 flex-gap-2">
                 <div className="flex items-center">
                   <Cpu size={16} className="text-blue-500 mr-2" />
                   <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Planner Node Active</span>
                 </div>
                 <div>
                   <select 
                     value={routingMode} 
                     onChange={(e) => setRoutingMode(e.target.value as any)}
                     disabled={loading}
                     className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 bg-white dark:bg-slate-800"
                   >
                     <option value="default">Default Model (Flash)</option>
                     <option value="fast">Low-Latency (Flash-Lite)</option>
                     <option value="thinking">High Thinking (Pro)</option>
                     <option value="grounded">Search Grounded (Flash)</option>
                     <option value="maps">Maps Grounded (Flash)</option>
                   </select>
                 </div>
               </div>
               <div className="flex p-2 relative">
                 <input
                   type="text"
                   value={intent}
                   onChange={(e) => setIntent(e.target.value)}
                   placeholder="e.g., 'Find the latest support tickets for our enterprise database issue and notify engineering on Slack.'"
                   className="w-full text-lg p-4 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                   disabled={loading}
                 />
                 <button
                   type="submit"
                   disabled={loading || !intent.trim()}
                   className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-white p-3 rounded-xl shadow-md"
                 >
                   {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                 </button>
               </div>
            </form>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-8">
                 <AlertTriangle /> {error}
              </div>
            )}

            {/* Workflow Visualization Canvas */}
            <div className="flex-1 min-h-[400px] bg-slate-100 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 p-8 overflow-y-auto relative">
               
               {!loading && !plan && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner border border-slate-300 dark:border-slate-700">
                        <Workflow size={40} className="text-slate-400 dark:text-slate-500" />
                     </div>
                     <p className="font-medium text-lg">Waiting for user intent...</p>
                     <p className="text-sm mt-2 max-w-sm text-center">Workflows are dynamically generated at runtime by translating intent to available Registry APIs.</p>
                  </div>
               )}

               {loading && (
                 <div className="h-full flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 animate-pulse">Orchestrating Plan...</h3>
                    <div className="flex gap-2">
                       <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                    </div>
                 </div>
               )}

               {plan && (
                 <div className="max-w-4xl mx-auto w-full pb-20">
                    <GraphVisualization plan={plan} activeStepIndex={activeStepIndex} />
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                       <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl border-l-4 border-blue-600 pl-3">Generated Execution Plan</h3>
                       <div className="flex gap-3">
                         <button 
                           type="button"
                           onClick={() => {
                             const visualSteps: VisualStep[] = plan.map((p, index) => ({
                               id: p.id || `step-${index}`,
                               toolName: p.toolName,
                               rationale: p.rationale,
                               mockPayload: p.mockPayload,
                               humanApprovalRequired: p.humanApprovalRequired,
                               agentType: 'custom'
                             }));
                             setCanvasPreloadSteps(visualSteps);
                             setActiveMode('canvas');
                           }}
                           className="bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                         >
                           <LayoutGrid size={15} /> Edit in Canvas
                         </button>
                         {activeStepIndex === -1 && (
                           <button onClick={executePlan} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                              <Play size={18} fill="currentColor" /> Run Workflow
                           </button>
                         )}
                       </div>
                    </div>

                    <div className="relative space-y-6">
                       {/* Connecting Line */}
                       <div className="absolute top-2 bottom-2 left-[23px] w-1 bg-gradient-to-b from-blue-200 to-transparent" />
                       
                       <AnimatePresence>
                         {plan.map((step, idx) => {
                           const isActive = activeStepIndex === idx;
                           const isPast = activeStepIndex > idx;
                           
                           return (
                             <motion.div 
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               key={idx} 
                               className="relative pl-16 pr-4"
                             >
                               {/* Timeline Node */}
                               <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 transition-colors duration-500
                                 ${isPast ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500 dark:text-slate-400'}
                               `}>
                                  {isPast ? <CheckCircle2 size={24} /> : <span className="font-bold text-lg">{idx + 1}</span>}
                               </div>

                               {/* Content Card */}
                               <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm transition-all duration-300
                                  ${isActive ? 'border-blue-400 shadow-blue-500/20 shadow-xl ring-2 ring-blue-100' : 'border-slate-200'}
                                  ${isPast ? 'opacity-70' : 'opacity-100'}
                               `}>
                                  <div className="flex justify-between items-start mb-4">
                                     <div>
                                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Action Engine</div>
                                       <h4 className="text-lg font-bold text-blue-900">{step.toolName}</h4>
                                     </div>
                                     {step.humanApprovalRequired && (
                                       <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-orange-200 shadow-sm">
                                         <ShieldAlert size={14} /> HITL Approval
                                       </div>
                                     )}
                                  </div>

                                  <p className="text-slate-600 dark:text-slate-400 mb-4">{step.rationale}</p>

                                  <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                    <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap">{step.mockPayload || '{}'}</pre>
                                  </div>

                                  {isActive && step.humanApprovalRequired && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }} 
                                      animate={{ opacity: 1, height: 'auto' }} 
                                      className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200 flex items-center justify-between"
                                    >
                                       <span className="font-bold text-orange-800 text-sm">Execution paused for Human-in-the-Loop review.</span>
                                       <button 
                                         onClick={() => setActiveStepIndex(idx + 1)}
                                         className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                       >
                                         Approve & Continue
                                       </button>
                                    </motion.div>
                                  )}
                               </div>
                             </motion.div>
                           );
                         })}
                       </AnimatePresence>
                    </div>
                    
                    {activeStepIndex >= plan.length && plan.length > 0 && (
                       <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-12 text-center text-emerald-600 font-bold text-lg flex items-center justify-center gap-2">
                         <CheckCircle2 size={28} /> Workflow Execution Complete
                       </motion.div>
                    )}
                 </div>
               )}
            </div>
          </>
        ) : (
          <VisualWorkflowCanvas 
            initialSteps={canvasPreloadSteps} 
            onExecute={(updatedSteps) => {
              // Optionally sync canvas steps back to auto list so they can run with original controls
              const normalSteps = updatedSteps.map(u => ({
                id: u.id,
                toolName: u.toolName,
                rationale: u.rationale,
                mockPayload: u.mockPayload,
                humanApprovalRequired: u.humanApprovalRequired
              }));
              setPlan(normalSteps);
              if (onTutorialProgress) {
                onTutorialProgress('canvas_interaction');
              }
            }} 
          />
        )}
      </div>
    </div>
  );
}
