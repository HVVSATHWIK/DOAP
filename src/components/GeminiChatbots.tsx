import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, AlertCircle, Sparkle, RefreshCw, Layers, Brain, Terminal, MessageSquare, ChevronDown, CheckCircle2 } from 'lucide-react';
import { toast } from '../lib/toast';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface BotProfile {
  id: string;
  name: string;
  role: string;
  model: string;
  desc: string;
  avatarBg: string;
  avatarText: string;
  accentColor: string;
  initialMessage: string;
  suggestions: string[];
}

const BOTS_REGISTRY: BotProfile[] = [
  {
    id: 'planner-bot',
    name: 'Skyler',
    role: 'Planning Architect',
    model: 'Gemini 3.5 Flash',
    desc: 'Designs advanced multi-step execution plans from voice or text. High-speed reasoning.',
    avatarBg: 'bg-sky-500',
    avatarText: 'text-white',
    accentColor: 'sky',
    initialMessage: 'Greetings! I am Skyler, the Planning Architect. Describe any task, and I will outline a structured, secure orchestration plan using registered APIs and webhooks.',
    suggestions: [
      'Design a plan to audit system resources and post alerts to Discord.',
      'How does the orchestrator parse user intents into JSON schemas?',
      'Create a three-step customer support sync with Slack notifications.'
    ]
  },
  {
    id: 'data-bot',
    name: 'Nimbus',
    role: 'Scientific Data Optimizer',
    model: 'Gemini 3.1 Pro (Thinking High)',
    desc: 'Optimizes database schemas, monitors query performance, and manages system token budgets.',
    avatarBg: 'bg-indigo-500',
    avatarText: 'text-white',
    accentColor: 'indigo',
    initialMessage: 'Hello, I am Nimbus. With Gemini Pro High-Thinking activated, I perform deep-dive payload diagnostics, database schema optimization, and system safety audits.',
    suggestions: [
      'Show me an optimized schema for keeping user-authored notes with low index overhead.',
      'Explain how we can manage token budget metrics efficiently in a high-concurrency app.',
      'Help me draft a robust JSON validation pattern for MCP payloads.'
    ]
  },
  {
    id: 'mcp-bot',
    name: 'Zippy',
    role: 'Fast MCP Assistant',
    model: 'Gemini 3.1 Flash Lite',
    desc: 'Realtime JSON-RPC connector, fast transporter, low latency routing advisor.',
    avatarBg: 'bg-cyan-500',
    avatarText: 'text-white',
    accentColor: 'cyan',
    initialMessage: 'Hey! I am Zippy, your MCP copilot! Let’s hook up external resources, run RPC transport pings, and debug connector endpoints at warp speed!',
    suggestions: [
      'How do I test a local MCP connector endpoint?',
      'Tell me the standard format of a JSON-RPC notification for DAOP.',
      'Mock a server transport configuration for a support ticket database.'
    ]
  }
];

export function GeminiChatbots({ onTutorialProgress }: { onTutorialProgress?: (action: string) => void }) {
  const [activeBot, setActiveBot] = useState<BotProfile>(BOTS_REGISTRY[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'planner-bot': [
      { id: '1', sender: 'bot', text: BOTS_REGISTRY[0].initialMessage, timestamp: new Date() }
    ],
    'data-bot': [
      { id: '1', sender: 'bot', text: BOTS_REGISTRY[1].initialMessage, timestamp: new Date() }
    ],
    'mcp-bot': [
      { id: '1', sender: 'bot', text: BOTS_REGISTRY[2].initialMessage, timestamp: new Date() }
    ]
  });
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeBot]);

  const activeMessages = messages[activeBot.id] || [];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    // Update messages locally
    const currentBotMessages = [...activeMessages, userMsg];
    setMessages(prev => ({
      ...prev,
      [activeBot.id]: currentBotMessages
    }));
    setInputText('');
    setLoading(true);

    try {
      // Trigger tutorial action check
      if (onTutorialProgress) {
        onTutorialProgress('chat_sent');
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botId: activeBot.id,
          messages: currentBotMessages.map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (!res.ok) {
        throw new Error('Could not connect to Gemini service. Please verify server is online.');
      }

      const data = await res.json();
      const botResponse: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => ({
        ...prev,
        [activeBot.id]: [...prev[activeBot.id], botResponse]
      }));

      // Report progress
      if (onTutorialProgress) {
        onTutorialProgress('chat_received');
      }

    } catch (err: any) {
      toast('Chat Error', err.message || 'Error executing Gemini model chat stream.', 'error');
      
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: `⚠️ Engine Error: ${err.message || 'System was unable to contact Gemini model endpoint. Check the environment configuration.'}`,
        timestamp: new Date()
      };
      setMessages(prev => ({
        ...prev,
        [activeBot.id]: [...prev[activeBot.id], errorMsg]
      }));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages(prev => ({
      ...prev,
      [activeBot.id]: [
        { id: Math.random().toString(), sender: 'bot', text: activeBot.initialMessage, timestamp: new Date() }
      ]
    }));
    toast('History Reset', `Conversation with ${activeBot.name} of DAOP has been cleared.`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Bot Header Selector */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 p-4 text-white relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg`}>
              <Bot size={22} className="text-white drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">{activeBot.name}</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono text-sky-100">{activeBot.model}</span>
              </div>
              <p className="text-xs text-sky-100 font-medium">{activeBot.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1 text-xs font-bold"
              title="Switch Specialist Bot"
            >
              Agents <ChevronDown size={14} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            <button 
              onClick={clearHistory}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              title="Clear active session"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Dropdown switch */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-3 right-3 top-16 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-sky-100 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1">Choose Specialist Agent</div>
                {BOTS_REGISTRY.map((bot) => (
                  <button
                    key={bot.id}
                    onClick={() => {
                      setActiveBot(bot);
                      setShowDropdown(false);
                      toast('Agent Switched', `You are now talking to ${bot.name} (${bot.role})`, 'info');
                    }}
                    className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
                      activeBot.id === bot.id 
                        ? 'bg-sky-50 dark:bg-slate-700/60 border border-sky-200 dark:border-slate-600' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${bot.avatarBg} ${bot.avatarText} flex items-center justify-center font-bold text-sm shrink-0`}>
                      {bot.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{bot.name}</span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full text-slate-500 font-mono">{bot.model}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{bot.role}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{bot.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Specialist Status Indicator Banner */}
      <div className="bg-sky-50/50 dark:bg-slate-800/40 px-4 py-2 border-b border-sky-100 dark:border-slate-800 shrink-0 flex items-center gap-2">
         {activeBot.id === 'planner-bot' && (
           <>
             <Layers size={12} className="text-sky-500" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 dark:text-sky-400">Layout & Flow Coordinator</span>
           </>
         )}
         {activeBot.id === 'data-bot' && (
           <>
             <Brain size={12} className="text-indigo-500" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">High thinking deep agent ready</span>
           </>
         )}
         {activeBot.id === 'mcp-bot' && (
           <>
             <Terminal size={12} className="text-cyan-500" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-600 dark:text-cyan-400">Fast RPC & Transport node active</span>
           </>
         )}
         <div className="ml-auto flex items-center gap-1">
           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">ONLINE</span>
         </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/10">
        {activeMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full items-start gap-2.5`}
            >
              {!isUser && (
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${activeBot.avatarBg} ${activeBot.avatarText} shadow-sm`}>
                  {activeBot.name[0]}
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                isUser 
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-sky-50/60 dark:border-slate-700/50'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed leading-6">{msg.text}</p>
                <span className={`text-[9px] mt-1 block h-3 ${isUser ? 'text-sky-100 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start w-full items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${activeBot.avatarBg} ${activeBot.avatarText} animate-pulse`}>
              {activeBot.name[0]}
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-none px-4 py-3 bg-white dark:bg-slate-800 border border-sky-50/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {activeBot.id === 'data-bot' ? 'Nimbus is thinking deeply...' : `${activeBot.name} is computing...`}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips if idle */}
      {activeMessages.length <= 2 && (
        <div className="px-4 py-2 bg-sky-50/20 dark:bg-slate-850/20 border-t border-sky-50 dark:border-slate-800/80 shrink-0">
          <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkle size={10} className="animate-spin duration-3000" /> Ask me:
          </div>
          <div className="flex flex-col gap-1">
            {activeBot.suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s)}
                className="w-full text-left text-xs bg-white hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-sky-100/60 dark:border-slate-700 rounded-lg py-1.5 px-3 truncate transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-sky-100 dark:border-slate-800 shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder={`Instruct ${activeBot.name}...`}
          className="flex-1 bg-sky-50/40 focus:bg-white dark:bg-slate-800 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 px-4 py-2.5 rounded-xl border border-sky-100/60 focus:border-sky-300 dark:border-slate-700 dark:focus:border-slate-600 text-sm transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/10 active:scale-95 transition-all shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
