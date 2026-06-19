import React, { useEffect, useState } from 'react';
import { Database, Plus, Search, Server, ToyBrick, Globe, ShieldCheck, X, Link, AlertCircle } from 'lucide-react';
import { toast } from '../lib/toast';

interface Resource {
  id: string;
  name: string;
  schema: string;
  type: string;
}

interface ResourceRegistryProps {
  onTutorialProgress?: (action: string) => void;
}

export function ResourceRegistry({ onTutorialProgress }: ResourceRegistryProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modal form states
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('api');
  const [newSchema, setNewSchema] = useState('');
  const [newId, setNewId] = useState('');

  const fetchResources = () => {
    fetch('/api/resources')
      .then((res) => res.json())
      .then((data) => {
        setResources(data.resources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSchema.trim() || !newId.trim()) {
      toast('Form Incomplete', 'Please fill out all fields before registering tools.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId.toLowerCase().replace(/\s+/g, '-'),
          name: newName,
          type: newType,
          schema: newSchema
        })
      });

      if (response.ok) {
        toast('Tool Registered', `Successfully declared tool ${newName} into transport cache.`, 'success');
        if (onTutorialProgress) {
          onTutorialProgress('resource_add');
        }
        setShowAddModal(false);
        // Reset states
        setNewName('');
        setNewSchema('');
        setNewId('');
        fetchResources();
      } else {
        throw new Error('Registration payload rejected');
      }
    } catch (err) {
      toast('Registration Failed', 'Could not register custom tool. Verify backend schema.', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'resource': return <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 shadow-md shadow-sky-500/10 border border-sky-300 flex items-center justify-center text-white"><Database size={22} /></div>;
      case 'api': return <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-500/10 border border-sky-300 flex items-center justify-center text-white"><Globe size={22} /></div>;
      case 'mcp': return <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-md shadow-sky-450/10 border border-cyan-300 flex items-center justify-center text-white"><ToyBrick size={22} /></div>;
      default: return <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-sky-600 shadow-md shadow-sky-500/10 border border-sky-300 flex items-center justify-center text-white"><Server size={22} /></div>;
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.schema.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = typeFilter === 'All Types' || 
                          (typeFilter === 'External API' && res.type === 'api') ||
                          (typeFilter === 'Database (Resource)' && res.type === 'resource') ||
                          (typeFilter === 'MCP Tool' && res.type === 'mcp');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full relative p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-150/40 pb-4">
           <div>
             <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
               <div className="bg-sky-500 text-white p-2 rounded-xl shadow-lg shadow-sky-500/20">
                 <Database size={24} />
               </div>
               Resource Registry
             </h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Central catalog of tools, APIs, and databases available to the AI Planner node.</p>
           </div>
           
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-500/15 transition-all text-sm"
           >
              <Plus size={18} /> Register Tool
           </button>
        </header>

        {/* Filter controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-850 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resource tags and schemas..." 
              className="w-full bg-sky-50/20 focus:bg-white dark:bg-slate-900 border border-sky-100/60 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-sky-400 transition-colors text-sm" 
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto bg-sky-50/20 dark:bg-slate-900 border border-sky-100/60 dark:border-slate-700 rounded-xl px-4 py-2 outline-none text-slate-600 dark:text-slate-400 font-medium text-sm"
          >
             <option>All Types</option>
             <option>External API</option>
             <option>Database (Resource)</option>
             <option>MCP Tool</option>
          </select>
        </div>
        
        {/* Resource grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-medium">
            <div className="w-10 h-10 border-2 border-sky-300 border-t-sky-500 rounded-full animate-spin mb-3" />
            <span>Parsing active registry schemas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 border-2 border-dashed border-sky-100 rounded-2xl bg-white/50">
                 <Link size={30} className="mx-auto mb-2 text-slate-300" />
                 <p className="font-semibold text-sm">No matching resources found.</p>
                 <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or create a new endpoint tool.</p>
              </div>
            ) : (
              filteredResources.map((res) => (
                <div 
                  key={res.id} 
                  className="border border-sky-150/40 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500-[5%] transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl p-5 flex gap-4 items-start group cursor-pointer"
                >
                   <div className="group-hover:scale-105 transition-transform shrink-0">
                      {getIcon(res.type)}
                   </div>
                   
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start mb-2 gap-2">
                         <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 duration-250">{res.name}</h3>
                         <span className="bg-sky-50 dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 text-sky-600 dark:text-sky-450 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">{res.type}</span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs leading-relaxed line-clamp-2">{res.schema}</p>
                      
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-sky-50/20 pt-3">
                         <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> Web-RPC OK</span>
                         <span className="truncate">ID: {res.id}</span>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Custom Tool Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-sky-100/50">
            <div className="border-b border-sky-50 bg-sky-50/30 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Register New System Endpoint</h3>
                <p className="text-xs text-slate-500 mt-1">Populate transport schemes for AI Agent parsing.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Resource ID (Unique Namekey)</label>
                <input
                  type="text"
                  placeholder="e.g. support-ticket-db"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-sky-100 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Friendly Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Customer Ticket Sync"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-sky-100 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">API Node Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-400 transition cursor-pointer"
                >
                  <option value="api">External API Webservice</option>
                  <option value="resource">Database / Data Lakehouse</option>
                  <option value="mcp">Model Context Protocol Node</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Functional JSON Schema / Details</label>
                <textarea
                  placeholder="Describe parameters of the API: gets support tickets, post message, require API key, payload keys..."
                  required
                  rows={3}
                  value={newSchema}
                  onChange={(e) => setNewSchema(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-sky-100 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-400 transition"
                />
              </div>

              <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 flex items-start gap-2 text-xs text-sky-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>By registering this API tool, DAOP's planner model will automatically trigger it when parsing matching intents.</span>
              </div>

              <div className="border-t border-sky-50 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
