import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, Link2, Unlink, LayoutDashboard } from 'lucide-react';
import { toast } from '../lib/toast';

interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  resourcesProvided: number;
}

export function McpConnections() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/mcp-servers');
      const data = await res.json();
      setServers(data.servers);
    } catch (err) {
      toast('Error', 'Failed to fetch MCP servers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Poll for connection state changes if there are connecting servers
  useEffect(() => {
    fetchServers();
    const hasConnecting = servers.some(s => s.status === 'connecting');
    if (hasConnecting) {
      const interval = setInterval(fetchServers, 1000);
      return () => clearInterval(interval);
    }
  }, [servers.map(s => s.status).join(',')]); // re-run effect if status changes

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    try {
      setIsAdding(true);
      await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, url: newUrl })
      });
      setNewName('');
      setNewUrl('');
      fetchServers();
      toast('Server Added', 'Connecting to the new MCP server...', 'info');
    } catch (err) {
      toast('Error', 'Failed to add server', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await fetch(`/api/mcp-servers/${id}/disconnect`, { method: 'POST' });
      fetchServers();
      toast('Disconnected', 'MCP server connection closed', 'info');
    } catch (err) {
      toast('Error', 'Failed to disconnect', 'error');
    }
  };

  const handleConnect = async (id: string) => {
    try {
      await fetch(`/api/mcp-servers/${id}/connect`, { method: 'POST' });
      fetchServers();
      toast('Connecting', 'Attempting to establish connection...', 'info');
    } catch (err) {
      toast('Error', 'Failed to connect', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await fetch(`/api/mcp-servers/${id}`, { method: 'DELETE' });
      fetchServers();
      toast('Deleted', `${name} removed`, 'info');
    } catch (err) {
      toast('Error', 'Failed to delete server', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400">
               <LayoutDashboard className="text-white" size={26} />
            </div>
            Model Context Protocol
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Connect and manage external MCP servers to inject dynamic capabilities into your agents.
          </p>
        </header>

        <form onSubmit={handleAdd} className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h2 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
             <Plus size={18} /> Add MCP Connection
          </h2>
          <div className="flex gap-4">
             <input
               type="text"
               value={newName}
               onChange={(e) => setNewName(e.target.value)}
               placeholder="Server Name (e.g. Zendesk MCP)"
               className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 py-3 rounded-lg px-4 outline-none focus:border-blue-500 transition-colors"
               required
             />
             <input
               type="url"
               value={newUrl}
               onChange={(e) => setNewUrl(e.target.value)}
               placeholder="Connection URL (e.g. http://localhost:4000/mcp)"
               className="flex-[2] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 py-3 rounded-lg px-4 outline-none focus:border-blue-500 transition-colors"
               required
             />
             <button type="submit" disabled={isAdding} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:bg-slate-400">
               {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />} Connect
             </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && servers.length === 0 ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : servers.map(server => (
             <div key={server.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-start gap-4 transition-all hover:shadow-md hover:border-slate-300">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 border border-blue-400">
                       <Server size={20} className="text-white" />
                     </div>
                     <h3 className="font-bold text-slate-900 dark:text-white truncate" title={server.name}>{server.name}</h3>
                  </div>
                  
                  {server.status === 'connected' && <div title="Connected" className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded-full"><CheckCircle2 size={18} /></div>}
                  {server.status === 'connecting' && <div title="Connecting..." className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-1 rounded-full"><Loader2 size={18} className="animate-spin" /></div>}
                  {server.status === 'error' && <div title="Connection Error" className="text-red-500 bg-red-50 dark:bg-red-500/10 p-1 rounded-full"><XCircle size={18} /></div>}
                  {server.status === 'disconnected' && <div title="Disconnected" className="text-slate-400 bg-slate-50 dark:bg-slate-800 p-1 rounded-full"><Unlink size={18} /></div>}
                </div>
                
                <div className="w-full text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded truncate border border-slate-100 pointer-events-none">
                  {server.url}
                </div>

                <div className="flex items-center justify-between w-full mt-auto pt-2 border-t border-slate-100">
                   <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {server.status === 'connected' ? (
                         <span><strong className="text-blue-600 dark:text-blue-400">{server.resourcesProvided}</strong> Resources Available</span>
                      ) : (
                         <span>- Resources Offline -</span>
                      )}
                   </div>
                   
                   <div className="flex gap-2">
                     {server.status === 'connected' && (
                       <button onClick={() => handleDisconnect(server.id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded transition-colors" title="Disconnect">
                         <Unlink size={16} />
                       </button>
                     )}
                     {(server.status === 'disconnected' || server.status === 'error') && (
                       <button onClick={() => handleConnect(server.id)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded transition-colors" title="Reconnect">
                         <RefreshCw size={16} />
                       </button>
                     )}
                     <button onClick={() => handleDelete(server.id, server.name)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete Server">
                       <Trash2 size={16} />
                     </button>
                   </div>
                </div>
             </div>
          ))}
          {servers.length === 0 && !loading && (
             <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300">
               <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner border border-slate-300 dark:border-slate-700">
                  <LayoutDashboard size={40} className="text-slate-400 dark:text-slate-500" />
               </div>
               <span className="font-medium">No MCP servers connected. Add one to inject external context tools.</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
