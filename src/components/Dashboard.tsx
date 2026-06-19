import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Database, 
  Workflow, 
  Activity, 
  LayoutDashboard, 
  Bot, 
  Moon, 
  Sun, 
  GraduationCap, 
  MessageSquare, 
  Sparkles, 
  Compass, 
  BookOpen,
  ChevronRight,
  User,
  PanelRight
} from 'lucide-react';
import { Orchestrator } from './Orchestrator';
import { ResourceRegistry } from './ResourceRegistry';
import { AgentRegistry } from './AgentRegistry';
import { TaskQueue } from './TaskQueue';
import { McpConnections } from './McpConnections';
import { Toaster } from './Toaster';
import { toast } from '../lib/toast';
import { GeminiChatbots } from './GeminiChatbots';
import { OnboardingTutorial } from './OnboardingTutorial';

type Tab = 'orchestrator' | 'registry' | 'agents' | 'runs' | 'mcp';
type RightTab = 'academy' | 'chat';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orchestrator');
  const [activeRightTab, setActiveRightTab] = useState<RightTab>('academy');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [previousTasks, setPreviousTasks] = useState<any[]>([]);
  const [externalTutorialAction, setExternalTutorialAction] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle tutorial step validation helper:
  // When active tab is loaded for the first time, auto-validate welcome view
  useEffect(() => {
    if (activeTab === 'orchestrator') {
      triggerTutorialEvent('welcome_view');
    }
  }, [activeTab]);

  const triggerTutorialEvent = (actionCode: string) => {
    setExternalTutorialAction(actionCode);
    // clear immediately so that subsequent triggers are recognized
    setTimeout(() => {
      setExternalTutorialAction(null);
    }, 150);
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        
        setPreviousTasks(prev => {
          if (prev.length > 0) {
            data.tasks.forEach((t: any) => {
              const oldT = prev.find((pt: any) => pt.id === t.id);
              if (oldT && oldT.status !== 'failed' && t.status === 'failed') {
                 toast('Task Failed', t.error || `Agent encountered error in task: ${t.title}`, 'error');
              }
              if (oldT && oldT.status !== 'completed' && t.status === 'completed') {
                 toast('Task Completed', `Successfully executed workflow for: ${t.title}`, 'success');
              }
            });
          }
          return data.tasks;
        });
      } catch (err) {}
    };

    const interval = setInterval(poll, 2500);
    poll();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-sky-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors overflow-hidden">
      <Toaster />
      
      {/* Premium Skyblue & White Left Navigation Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-sky-100 dark:border-slate-800 flex flex-col shadow-sm shrink-0 z-20">
        <div className="h-16 flex items-center justify-between px-5 border-b border-sky-100/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative flex flex-none items-center justify-center w-9 h-9">
              {/* Outer soft breathing glow */}
              <div className="absolute inset-0 bg-sky-400/20 rounded-xl blur animate-pulse"></div>
              {/* Main premium frame */}
              <div className="relative w-full h-full bg-sky-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/10 border border-sky-400 overflow-hidden">
                {/* Vector Premium Logo */}
                <svg className="w-4.5 h-4.5 text-white drop-shadow-md z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 16 L79.4 33 L79.4 67 L50 84 L20.6 67 L20.6 33 Z" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M50 30 L67.3 40 L67.3 60 L50 70 L32.7 60 L32.7 40 Z" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="50" cy="50" r="10" fill="#ffffff" />
                </svg>
              </div>
            </div>
            
            <div>
              <span className="font-display font-black text-lg text-slate-800 dark:text-white tracking-tight">DAOP</span>
              <span className="text-[9px] block font-mono text-sky-600 dark:text-sky-400 font-bold tracking-widest mt-0.5">PLATFORM</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        
        {/* Navigation block */}
        <div className="flex-1 overflow-y-auto py-5">
          <nav className="space-y-1.5 px-3">
            <button
              onClick={() => setActiveTab('orchestrator')}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                activeTab === 'orchestrator' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Workflow size={16} className="mr-3" />
              Orchestration Hub
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                activeTab === 'registry' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Database size={16} className="mr-3" />
              Resource Registry
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                activeTab === 'agents' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Bot size={16} className="mr-3" />
              AI Agents
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                activeTab === 'runs' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Activity size={16} className="mr-3" />
              Execution Logs
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                activeTab === 'mcp' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={16} className="mr-3" />
              MCP Connections
            </button>
          </nav>
        </div>
        
        {/* Core Node status indicator */}
        <div className="p-4 border-t border-sky-100/60 dark:border-slate-800 bg-sky-50/20 dark:bg-slate-900/40">
           <div className="flex items-center gap-3 px-2 py-1 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Service Status Ready
           </div>
        </div>
      </aside>

      {/* Primary Workspace container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Skyblue top utilities bar */}
        <header className="h-16 border-b border-sky-100/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-sky-50 dark:bg-slate-800 border border-sky-100 text-sky-600 dark:text-sky-400 font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-widest text-[9px]">
              V3.5 ENGINE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Header shortcuts */}
            <button 
              onClick={() => {
                setActiveRightTab('academy');
                setShowRightPanel(true);
              }}
              className="p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold border border-sky-50 text-slate-600 dark:text-slate-300 bg-white hover:bg-sky-50/40 dark:bg-slate-800 dark:border-slate-755 transition"
              title="Instructors Academy"
            >
              <GraduationCap size={14} className="text-sky-500" /> Training Hub
            </button>

            <button 
              onClick={() => {
                setActiveRightTab('chat');
                setShowRightPanel(true);
              }}
              className="p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold border border-sky-50 text-slate-600 dark:text-slate-300 bg-white hover:bg-sky-50/40 dark:bg-slate-800 dark:border-slate-755 transition"
              title="AI Specialist Team Chat"
            >
              <MessageSquare size={14} className="text-indigo-500" /> Specialist Chat
            </button>

            {/* Collapse Panel Button toggles right training screen */}
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-2 rounded-xl text-slate-500 bg-slate-50 border border-slate-200/60 hover:text-sky-500 hover:bg-sky-50 dark:bg-slate-800 dark:border-slate-755 transition ${showRightPanel ? 'text-sky-500' : ''}`}
              title="Toggle Lesson Drawer"
            >
              <PanelRight size={17} />
            </button>
          </div>
        </header>

        {/* Dynamic Inner Subcomponent Pages */}
        <main className="flex-1 overflow-hidden relative bg-slate-50/50 dark:bg-slate-900/10">
           {activeTab === 'orchestrator' && <Orchestrator onTutorialProgress={triggerTutorialEvent} />}
           {activeTab === 'registry' && <ResourceRegistry onTutorialProgress={triggerTutorialEvent} />}
           {activeTab === 'agents' && <AgentRegistry onTutorialProgress={triggerTutorialEvent} />}
           {activeTab === 'runs' && <TaskQueue />}
           {activeTab === 'mcp' && <McpConnections />}
        </main>
      </div>

      {/* Onboarding & Chat specialists split sidebar (Collapsible) */}
      {showRightPanel && (
        <aside className="w-96 bg-white dark:bg-slate-900 border-l border-sky-100 dark:border-slate-800 flex flex-col shrink-0 h-full z-10 shadow-sm relative">
          {/* Tabs header for Companion Deck */}
          <div className="h-16 px-4 border-b border-sky-100/60 dark:border-slate-800 flex items-center justify-between bg-sky-50/30 dark:bg-slate-900/50 shrink-0">
            <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-sky-100 dark:border-slate-700 w-full">
              <button
                onClick={() => setActiveRightTab('academy')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeRightTab === 'academy'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/15'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                <GraduationCap size={13} />
                Academy
              </button>
              <button
                onClick={() => setActiveRightTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeRightTab === 'chat'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/15'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                <MessageSquare size={13} />
                AI Assistants
              </button>
            </div>
            
            <button 
              onClick={() => setShowRightPanel(false)}
              className="p-1 px-1.5 ml-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold uppercase"
              title="Close companion"
            >
              ✕
            </button>
          </div>

          {/* Core content drawer list */}
          <div className="flex-1 overflow-hidden p-4">
             {activeRightTab === 'academy' ? (
                <div className="h-full overflow-y-auto pr-1">
                  <OnboardingTutorial 
                    externalTrigger={externalTutorialAction || undefined} 
                    onResetTrigger={() => {}}
                  />
                </div>
             ) : (
                <div className="h-full">
                  <GeminiChatbots 
                    onTutorialProgress={triggerTutorialEvent}
                  />
                </div>
             )}
          </div>
        </aside>
      )}
    </div>
  );
}
