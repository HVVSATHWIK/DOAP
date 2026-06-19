import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, HelpCircle, CheckCircle2, ChevronRight, Sparkles, BookOpen, Key, Cpu, Zap, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '../lib/toast';

export interface TutorialTask {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  hint: string;
}

const INITIAL_STEPS: TutorialTask[] = [
  {
    id: 'welcome_view',
    title: 'Initialize DAOP Overview',
    description: 'Read the Dynamic Agentic Orchestration manual to understand the transport layer.',
    xp: 50,
    completed: false,
    hint: 'Simply view the Orchestration Hub or read this training sidebar!'
  },
  {
    id: 'resource_add',
    title: 'Register a System Resource',
    description: 'Go to the Resource Registry tab and create an API webhook, database, or Discord link.',
    xp: 150,
    completed: false,
    hint: 'Navigate to Resource Registry and click "Add Resource". Choose Discord Hook or Postgres Server.'
  },
  {
    id: 'agent_deploy',
    title: 'Mobilize custom AI Agent',
    description: 'Deploy a specialized cognitive agent in the AI Agents tab to monitor workloads.',
    xp: 150,
    completed: false,
    hint: 'Navigate to AI Agents, set appropriate values, and deploy your agent.'
  },
  {
    id: 'plan_orchestrated',
    title: 'Formulate an Orchestration Plan',
    description: 'Enter a workflow intent in the orchestrator planner to dynamically generate API sequences.',
    xp: 200,
    completed: false,
    hint: 'Use the text planner box to type e.g., "Summarize hot tickets and post to slack" and click send!'
  },
  {
    id: 'canvas_interaction',
    title: 'Construct a Manual Canvas Plan',
    description: 'Switch to the Interactive Canvas and add, adjust, or edit action items manually.',
    xp: 200,
    completed: false,
    hint: 'Click "Edit in Canvas" or switch active planner mode to manual canvas.'
  },
  {
    id: 'chat_sent',
    title: 'Query Specialist Chatbots',
    description: 'Trigger a conversational multi-turn chat sequence with Skyler, Nimbus, or Zippy.',
    xp: 100,
    completed: false,
    hint: 'Select the Chatbot drawer on the right side and send a technical request to Nimbus.'
  }
];

export function OnboardingTutorial({
  externalTrigger,
  onResetTrigger
}: {
  externalTrigger?: string;
  onResetTrigger?: () => void;
}) {
  const [tasks, setTasks] = useState<TutorialTask[]>(() => {
    const saved = localStorage.getItem('daop_tutorial_tasks_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return INITIAL_STEPS;
      }
    }
    return INITIAL_STEPS;
  });

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useEffect(() => {
    // If we received an external event trigger from other parts of the app
    if (externalTrigger) {
      const taskToComplete = tasks.find(t => t.id === externalTrigger && !t.completed);
      if (taskToComplete) {
        const updated = tasks.map(t => {
          if (t.id === externalTrigger) {
            return { ...t, completed: true };
          }
          return t;
        });
        setTasks(updated);
        localStorage.setItem('daop_tutorial_tasks_v2', JSON.stringify(updated));
        toast('Achievement Unlocked!', `Unlocked task: ${taskToComplete.title} (+${taskToComplete.xp} XP)`, 'success');
      }
    }
  }, [externalTrigger, tasks]);

  const totalXP = tasks.reduce((sum, t) => sum + (t.completed ? t.xp : 0), 0);
  const maxXP = tasks.reduce((sum, t) => sum + t.xp, 0);
  const completedCount = tasks.filter(t => t.completed).length;
  const isFinished = completedCount === tasks.length;

  const resetTutorial = () => {
    localStorage.removeItem('daop_tutorial_tasks_v2');
    setTasks(INITIAL_STEPS.map(t => ({ ...t, completed: t.id === 'welcome_view' })));
    setActiveStepIdx(0);
    if (onResetTrigger) onResetTrigger();
    toast('Tutorial Reset', 'Onboarding progression stats have been initialized.', 'info');
  };

  const currentTask = tasks[activeStepIdx] || tasks[0];

  return (
    <div className="bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Gamified Training</h3>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">Dynamic Orchestration Instructor</p>
          </div>
        </div>
        
        <button 
          onClick={resetTutorial}
          className="text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition"
          title="Reset Tutorial Paths"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Progress metrics */}
      <div className="mb-6 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-sky-100/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <Sparkles size={40} className="text-sky-500 animate-pulse" />
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Progression Metrics</span>
          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-450">{totalXP} / {maxXP} XP</span>
        </div>
        
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(totalXP / maxXP) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px]">
          <span className="font-medium text-slate-400 dark:text-slate-500">Modules Completed:</span>
          <span className="bg-sky-50 dark:bg-slate-700 px-2.5 py-0.5 rounded-full font-bold text-sky-600 dark:text-sky-400">
            {completedCount} / {tasks.length} Completed
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isFinished ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-5 rounded-2xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={24} className="animate-bounce" />
            </div>
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-400">Superb Orchestrator Certified!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1 max-w-xs mx-auto">
              You’ve achieved maximum {totalXP} XP! You have successfully mastered Registry declarations, AI agent planning modes, and human-in-the-loop review.
            </p>
            <button
              onClick={resetTutorial}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition"
            >
              Reset and Train Again
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Guide Step details */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-sky-100/40 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-sky-500" />
                <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Active Module: Step {activeStepIdx + 1}</span>
              </div>
              
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {currentTask.title}
                {currentTask.completed && (
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{currentTask.description}</p>
              
              <div className="mt-3.5 bg-sky-50/40 dark:bg-slate-900/50 p-3 rounded-xl border border-sky-100/50 dark:border-slate-800 flex items-start gap-2">
                <AlertCircle size={14} className="text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-450 uppercase tracking-wider block">Instruction / Tip</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{currentTask.hint}</p>
                </div>
              </div>
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex gap-1.5">
                {tasks.map((t, idx) => (
                  <button 
                    key={t.id}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold border transition ${
                      idx === activeStepIdx 
                        ? 'bg-sky-500 text-white border-sky-500' 
                        : t.completed 
                          ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-800 text-emerald-700' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-705 text-slate-400'
                    }`}
                    title={t.title}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setActiveStepIdx((activeStepIdx + 1) % tasks.length)}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition"
              >
                Next Step <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Summary List */}
      <div className="mt-6 border-t border-sky-100 dark:border-slate-850 pt-4">
        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">Checklist Progress Map</label>
        <div className="space-y-2">
          {tasks.map((t, idx) => (
            <button
              onClick={() => setActiveStepIdx(idx)}
              key={t.id}
              className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                idx === activeStepIdx 
                  ? 'bg-sky-500/10 border-sky-200 text-sky-800 dark:text-sky-300' 
                  : 'bg-white/40 border-slate-100 hover:bg-slate-50 text-slate-650'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                  t.completed 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-slate-50 text-slate-450 border-slate-200'
                }`}>
                  {t.completed ? '✓' : idx + 1}
                </div>
                <span className="text-xs font-semibold truncate text-slate-700 dark:text-slate-300">{t.title}</span>
              </div>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold shrink-0">+{t.xp} XP</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
