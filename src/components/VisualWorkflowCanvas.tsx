import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, Trash2, ArrowUp, ArrowDown, Settings, ShieldAlert, 
  CheckCircle2, Workflow, Bot, Cpu, PlusCircle, Edit3, X, GripVertical, 
  Code, Eye, RefreshCw, Layers, Sparkles, Database, FileText
} from 'lucide-react';
import { toast } from '../lib/toast';

export interface VisualStep {
  id: string;
  toolName: string;
  rationale: string;
  mockPayload: string;
  humanApprovalRequired: boolean;
  agentType?: 'analytical' | 'support' | 'research' | 'compliance' | 'custom';
}

interface VisualWorkflowCanvasProps {
  initialSteps?: VisualStep[];
  onExecute?: (steps: VisualStep[]) => void;
}

const AGENT_TEMPLATES = [
  {
    name: 'Data Analyst',
    type: 'analytical' as const,
    toolName: 'SQL Engine & Pivot Reporter',
    rationale: 'Fetch enterprise client request records and extract database logs.',
    mockPayload: JSON.stringify({ query: "SELECT * FROM support_tickets WHERE priority = 'high';", limit: 50 }, null, 2),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Research Agent',
    type: 'research' as const,
    toolName: 'Bing & Scholar Aggregator',
    rationale: 'Search the web for solutions to known connection retry-loop exceptions.',
    mockPayload: JSON.stringify({ searchQuery: "PostgreSQL pool connection timeout error fixes", depth: "deep" }, null, 2),
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Customer Support Rep',
    type: 'support' as const,
    toolName: 'Slack & Zendesk Dispatcher',
    rationale: 'Post alerts and draft proposed solution summaries to the user triage channel.',
    mockPayload: JSON.stringify({ channel: "#triage-alerts", message: "Discovered known patch for active ticket." }, null, 2),
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Compliance Auditor',
    type: 'compliance' as const,
    toolName: 'Payload Validation Guard',
    rationale: 'Verify syntax compliance and ensure zero sensitive authorization leaks.',
    mockPayload: JSON.stringify({ securityScan: "passed", dataRedacted: true }, null, 2),
    color: 'from-rose-500 to-orange-500',
  }
];

export function VisualWorkflowCanvas({ initialSteps, onExecute }: VisualWorkflowCanvasProps) {
  const [steps, setSteps] = useState<VisualStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<VisualStep | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState(-1);
  const [viewPayloadId, setViewPayloadId] = useState<string | null>(null);

  // Form states for manual editing or creation
  const [formToolName, setFormToolName] = useState('');
  const [formRationale, setFormRationale] = useState('');
  const [formPayload, setFormPayload] = useState('');
  const [formHitl, setFormHitl] = useState(false);
  const [formAgentType, setFormAgentType] = useState<'analytical' | 'support' | 'research' | 'compliance' | 'custom'>('custom');

  useEffect(() => {
    if (initialSteps && initialSteps.length > 0) {
      setSteps(initialSteps);
    } else {
      // Default initial layout
      setSteps([
        {
          id: 'step-1',
          toolName: 'SQL Engine & Pivot Reporter',
          rationale: 'Fetch enterprise client request records and extract database logs.',
          mockPayload: JSON.stringify({ query: "SELECT * FROM support_tickets WHERE priority = 'high';", limit: 50 }, null, 2),
          humanApprovalRequired: false,
          agentType: 'analytical'
        },
        {
          id: 'step-2',
          toolName: 'Payload Validation Guard',
          rationale: 'Verify syntax compliance and ensure zero sensitive authorization leaks.',
          mockPayload: JSON.stringify({ securityScan: "passed", dataRedacted: true }, null, 2),
          humanApprovalRequired: true,
          agentType: 'compliance'
        }
      ]);
    }
  }, [initialSteps]);

  // Handle reordering
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const nextSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    // Swap elements
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIndex];
    nextSteps[targetIndex] = temp;
    setSteps(nextSteps);
  };

  // Add step from template
  const addTemplateStep = (template: typeof AGENT_TEMPLATES[0]) => {
    const newStep: VisualStep = {
      id: `step-${Date.now()}`,
      toolName: template.toolName,
      rationale: template.rationale,
      mockPayload: template.mockPayload,
      humanApprovalRequired: false,
      agentType: template.type,
    };
    setSteps([...steps, newStep]);
    toast('Success', `Added ${template.name} agent step to workflow Canvas`, 'success');
  };

  const deleteStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
    toast('Info', 'Step removed from configuration', 'info');
  };

  // Open edit sidebar
  const openEdit = (step: VisualStep, index: number) => {
    setSelectedStep(step);
    setEditingIndex(index);
    setFormToolName(step.toolName);
    setFormRationale(step.rationale);
    setFormPayload(step.mockPayload);
    setFormHitl(step.humanApprovalRequired);
    setFormAgentType(step.agentType || 'custom');
    setIsEditing(true);
  };

  const saveStepEdit = () => {
    if (!formToolName.trim()) {
      toast('Error', 'Tool/Task Name is required', 'error');
      return;
    }

    try {
      if (formPayload) {
        JSON.parse(formPayload);
      }
    } catch (e) {
      toast('Error', 'Invalid JSON payload sequence', 'error');
      return;
    }

    const updated = [...steps];
    updated[editingIndex] = {
      ...updated[editingIndex],
      toolName: formToolName,
      rationale: formRationale,
      mockPayload: formPayload,
      humanApprovalRequired: formHitl,
      agentType: formAgentType,
    };

    setSteps(updated);
    setIsEditing(false);
    setSelectedStep(null);
    toast('Success', 'Workflow node updated successfully', 'success');
  };

  // Run/Simulate the custom workflow sequence
  const handleExecute = () => {
    if (steps.length === 0) {
      toast('Error', 'Canvas empty! Please add steps first', 'error');
      return;
    }
    setIsRunning(true);
    setCurrentRunningIndex(0);
    toast('Success', 'Simulation started on custom design canvas', 'success');

    if (onExecute) {
      onExecute(steps);
    }
  };

  const advanceExecution = () => {
    if (currentRunningIndex < steps.length - 1) {
      setCurrentRunningIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      setCurrentRunningIndex(-1);
      toast('Success', 'Visual sequence execution completed', 'success');
    }
  };

  const stopExecution = () => {
    setIsRunning(false);
    setCurrentRunningIndex(-1);
    toast('Info', 'Execution halted', 'info');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Simulation Controls Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-sm border border-blue-400 text-white">
              <Workflow size={18} />
            </div>
            Visual Workflow Constructor
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build, structure and link agent sequences. Drag order, template new micro-agents or customize individual JSON payloads dynamically.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {isRunning ? (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                Running Step {currentRunningIndex + 1} of {steps.length}
              </span>
              <button 
                onClick={stopExecution}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Halt
              </button>
              {steps[currentRunningIndex]?.humanApprovalRequired ? (
                <button 
                  onClick={advanceExecution}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <ShieldAlert size={12} /> HITL: Approve
                </button>
              ) : (
                <button 
                  onClick={advanceExecution}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Next Action
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={handleExecute}
              disabled={steps.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              <Play size={16} fill="currentColor" /> Run Designer Plan
            </button>
          )}

          <button 
            onClick={() => {
              setSteps([]);
              toast('Info', 'Canvas cleared', 'info');
            }}
            className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm px-4 py-2.5 rounded-xl transition"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Agent Palette Templates */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-yellow-500" /> Agent Palette
            </h3>
            <p className="text-xs text-slate-500 mb-4">Click to deploy template micro-agents directly onto the canvas grid.</p>
            
            <div className="flex flex-col gap-3">
              {AGENT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => addTemplateStep(tpl)}
                  className="group relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 text-left transition-all duration-300 flex items-start gap-3 shadow-sm hover:border-blue-300"
                >
                  {/* Color Left bar indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${tpl.color}`} />
                  
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tpl.color} flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-115 transition-transform`}>
                    <Bot size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{tpl.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{tpl.toolName}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Workflow size={160} />
            </div>
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Cpu size={16} /> Technical Blueprint
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              Dynamically links each agent's upstream environment output straight into downstream task payloads. Toggle human-approval to pause execution.
            </p>
          </div>
        </div>

        {/* Center Canvas: Interactive Workflow Connection Plane */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 md:p-8 min-h-[500px] relative overflow-hidden">
            {/* Ambient Background Blueprint Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {steps.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-slate-700 flex items-center justify-center text-blue-600 mb-4 shadow-sm animate-bounce">
                  <Layers size={28} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Canvas Empty</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">Deploy agents from the left Palette, or define custom logic configurations.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 relative z-10 max-w-3xl mx-auto">
                <AnimatePresence>
                  {steps.map((step, idx) => {
                    const isActive = currentRunningIndex === idx;
                    const isDone = currentRunningIndex > idx;
                    
                    // Assign gradient background based on type
                    const gradientClass = 
                      step.agentType === 'analytical' ? 'border-l-blue-500' :
                      step.agentType === 'research' ? 'border-l-indigo-500' :
                      step.agentType === 'support' ? 'border-l-emerald-500' :
                      step.agentType === 'compliance' ? 'border-l-rose-500' : 'border-l-slate-400';

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`relative group bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${gradientClass}
                          ${isActive ? 'border-blue-500 shadow-blue-500/10 shadow-lg ring-2 ring-blue-500/20 scale-102 bg-blue-50/10 dark:bg-blue-950/10' : 'border-slate-200 dark:border-slate-700'}
                          ${isDone ? 'opacity-70' : 'opacity-100'}
                        `}
                      >
                        {/* Flow connect Line behind connector circle */}
                        {idx < steps.length - 1 && (
                          <div className="absolute left-[34px] bottom-[-32px] w-[2px] h-[32px] bg-gradient-to-b from-blue-300 dark:from-blue-800 to-transparent pointer-events-none hidden md:block" />
                        )}

                        <div className="flex items-start gap-4">
                          {/* Circle step badge */}
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-inner transition-colors duration-300
                            ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}
                          `}>
                            {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{step.toolName}</h4>
                              {step.agentType && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {step.agentType}
                                </span>
                              )}
                              {step.humanApprovalRequired && (
                                <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <ShieldAlert size={10} /> HITL Pause
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">{step.rationale}</p>
                            
                            {/* Actions bar inside task card */}
                            <div className="flex gap-4 mt-3">
                              <button 
                                onClick={() => setViewPayloadId(viewPayloadId === step.id ? null : step.id)}
                                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <Code size={12} /> {viewPayloadId === step.id ? 'Hide Params' : 'Show Params'}
                              </button>
                              <button 
                                onClick={() => openEdit(step, idx)}
                                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <Edit3 size={12} /> Customize
                              </button>
                            </div>

                            {/* Collapsible editable payload viewport */}
                            <AnimatePresence>
                              {viewPayloadId === step.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-3 overflow-hidden"
                                >
                                  <div className="bg-slate-900 text-blue-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 relative shadow-inner">
                                    <pre className="whitespace-pre-wrap">{step.mockPayload}</pre>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Right side: Ordering, deletion, and link modifiers */}
                        <div className="flex md:flex-col items-center gap-2 mt-4 md:mt-0 justify-end md:border-l border-slate-100 dark:border-slate-700 md:pl-4">
                          <div className="flex gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveStep(idx, 'up')}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:none transition-colors"
                              title="Move step upstream"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              disabled={idx === steps.length - 1}
                              onClick={() => moveStep(idx, 'down')}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:none transition-colors"
                              title="Move step downstream"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => deleteStep(idx)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-rose-950/20 border border-slate-200 dark:border-slate-700 hover:bg-rose-100 text-rose-600 transition shadow-sm ml-auto md:ml-0"
                            title="Delete task node"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Bottom Plus helper to quickly build custom nodes */}
                <button
                  onClick={() => {
                    const newId = `step-${Date.now()}`;
                    const customStep: VisualStep = {
                      id: newId,
                      toolName: 'Custom Dispatch Operator',
                      rationale: 'Review output parameters and execute action dispatchers.',
                      mockPayload: JSON.stringify({ action: "dispatch", data: {} }, null, 2),
                      humanApprovalRequired: false,
                      agentType: 'custom'
                    };
                    setSteps([...steps, customStep]);
                    openEdit(customStep, steps.length);
                  }}
                  className="mx-auto flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border border-slate-200 dark:border-slate-700 text-blue-600 font-bold text-xs py-3 px-6 rounded-2xl shadow-sm hover:border-blue-400 group transition-all"
                >
                  <PlusCircle size={14} className="group-hover:scale-120 transition-transform" /> 
                  Add Custom Action Step
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Dialog sidebar/panel */}
      <AnimatePresence>
        {isEditing && selectedStep && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="text-blue-600" size={20} />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Configure Node Parameters</h3>
                </div>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Agent Model Type</label>
                  <select
                    value={formAgentType}
                    onChange={(e) => setFormAgentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent font-medium text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500 bg-white dark:bg-slate-800"
                  >
                    <option value="custom">Custom Agent / Generalist</option>
                    <option value="analytical">Data Analyst & Extractor</option>
                    <option value="support">Customer Support Rep</option>
                    <option value="research">Research Operator</option>
                    <option value="compliance">Compliance Guard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tool / Task Name</label>
                  <input
                    type="text"
                    value={formToolName}
                    onChange={(e) => setFormToolName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent font-medium text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    placeholder="e.g. Email Dispatch Terminal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Task Rationale & Execution Plan</label>
                  <textarea
                    rows={3}
                    value={formRationale}
                    onChange={(e) => setFormRationale(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent font-medium text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    placeholder="Explain what and why this agent represents..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mock Payload Configuration (JSON)</label>
                  <textarea
                    rows={8}
                    value={formPayload}
                    onChange={(e) => setFormPayload(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl outline-none focus:border-blue-500"
                    placeholder="{}"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700">
                  <div className="flex gap-2 items-center">
                    <ShieldAlert className="text-orange-500" size={18} />
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Human Approval Gate</div>
                      <div className="text-[10px] text-slate-400">Pause workflow execution for validation</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formHitl}
                    onChange={(e) => setFormHitl(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={saveStepEdit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  Save Node Parameters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
