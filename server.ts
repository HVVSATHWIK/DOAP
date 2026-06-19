import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from 'dotenv';
config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini
// Initialize lazily to fail fast if used without keys but don't crash on boot.
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// In-memory mock resource registry
const resources = [
  { id: 'tool_1', name: 'Database Query', schema: 'Execute SQL queries against enterprise DB', type: 'resource' },
  { id: 'tool_2', name: 'Zendesk Ticket Create', schema: 'Create customer support ticket. Requires: Title, Description, Priority', type: 'api' },
  { id: 'tool_3', name: 'Slack Notify', schema: 'Send message to Slack channel. Requires: channelName, message', type: 'api' },
  { id: 'tool_5', name: 'Web Scraper', schema: 'Extract main text from target URL', type: 'mcp' },
  { id: 'tool_6', name: 'Google Maps API', schema: 'Location, Directions, and Address Validation', type: 'api' },
  { id: 'tool_7', name: 'n8n Workflow Webhook', schema: 'Trigger executing real-time n8n automated workflows', type: 'mcp' },
];

const agents = [
  { id: 'agent_1', name: 'Data Analyst', status: 'idle', type: 'analytical', description: 'Specializes in SQL, data extraction and visual reporting.', currentTask: null, capabilities: ['SQL Queries', 'Data Viz', 'Excel Export'] },
  { id: 'agent_2', name: 'Customer Support Rep', status: 'active', type: 'support', description: 'Handles ticket triaging, refund processing, and notifications.', currentTask: 'Processing Zendesk tickets...', capabilities: ['Zendesk API', 'Slack Alerts', 'Refund Auth'] },
  { id: 'agent_3', name: 'Researcher Planner', status: 'idle', type: 'planning', description: 'Performs deep web research and constructs execution plans.', currentTask: null, capabilities: ['Web Search', 'Data Synthesis', 'Plan Gen'] },
  { id: 'agent_4', name: 'Quality Assurance', status: 'offline', type: 'validation', description: 'Verifies the integrity and safety of execution payloads.', currentTask: null, capabilities: ['Payload Validation', 'Security Audit', 'Sandbox Exec'] },
];

interface TaskStep {
  id: string;
  toolName: string;
  rationale: string;
  mockPayload: string;
  humanApprovalRequired: boolean;
}

interface Task {
  id: string;
  title: string;
  intent: string;
  status: 'planning' | 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  plan: TaskStep[] | null;
  activeStepIndex: number;
  createdAt: number;
  error?: string;
  priority?: number;
}

const tasks: Task[] = [];

interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  resourcesProvided: number;
}

let mcpServers: McpServer[] = [
  { id: 'mcp_1', name: 'Internal Database MCP', url: 'http://localhost:4000/mcp', status: 'connected', resourcesProvided: 4 },
  { id: 'mcp_2', name: 'Zendesk Connector MCP', url: 'https://mcp.zendesk.internal/webhook', status: 'connected', resourcesProvided: 12 },
  { id: 'mcp_3', name: 'Experimental Web Search MCP', url: 'https://mcp-web.example.com', status: 'error', resourcesProvided: 0 },
];

app.get('/api/mcp-servers', (req, res) => {
  res.json({ servers: mcpServers });
});

app.post('/api/mcp-servers', (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });
  const newServer: McpServer = {
    id: `mcp_${Date.now()}`,
    name,
    url,
    status: 'connecting',
    resourcesProvided: 0
  };
  mcpServers.push(newServer);
  res.json({ server: newServer });

  // Simulate connection process
  setTimeout(() => {
    const s = mcpServers.find(s => s.id === newServer.id);
    if (s) {
       s.status = Math.random() > 0.2 ? 'connected' : 'error';
       if (s.status === 'connected') {
         s.resourcesProvided = Math.floor(Math.random() * 10) + 1;
       }
    }
  }, 2000);
});

app.post('/api/mcp-servers/:id/disconnect', (req, res) => {
  const s = mcpServers.find(s => s.id === req.params.id);
  if (s) {
    s.status = 'disconnected';
    s.resourcesProvided = 0;
  }
  res.json({ server: s });
});

app.post('/api/mcp-servers/:id/connect', (req, res) => {
  const s = mcpServers.find(s => s.id === req.params.id);
  if (s) {
    s.status = 'connecting';
    setTimeout(() => {
       const server = mcpServers.find(serve => serve.id === req.params.id);
       if (server) {
         server.status = 'connected';
         server.resourcesProvided = Math.floor(Math.random() * 10) + 1;
       }
    }, 1500);
  }
  res.json({ server: s });
});

app.delete('/api/mcp-servers/:id', (req, res) => {
  mcpServers = mcpServers.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/resources', (req, res) => {
  res.json({ resources });
});

app.get('/api/agents', (req, res) => {
  res.json({ agents });
});

app.get('/api/token-summary', (req, res) => {
  const agentSummaries = agents.map((agent, i) => {
    const seed = agent.id.charCodeAt(agent.id.length - 1);
    // Simulate some real-time token accumulation
    const tokensUsed = Math.floor(15000 + (Math.sin(seed * 3) * 5000) + Math.random() * 1000);
    // Set a budget that some agents might be approaching (e.g. 80-95% utilized)
    const budgetLimit = Math.floor(18000 + (Math.cos(seed) * 4000));
    
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      tokensUsed,
      budgetLimit
    };
  });
  
  const totalTokens = agentSummaries.reduce((sum, a) => sum + a.tokensUsed, 0);
  const totalBudget = agentSummaries.reduce((sum, a) => sum + a.budgetLimit, 0);

  res.json({
    totalTokens,
    totalBudget,
    agents: agentSummaries
  });
});

app.post('/api/agents', (req, res) => {
  const { name, type, description } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
  
  const newAgent = {
    id: `agent_${Date.now()}`,
    name,
    type,
    description: description || 'Custom deployed agent',
    status: 'idle',
    currentTask: null,
    capabilities: ['Dynamic Execution']
  };
  
  agents.push(newAgent);
  res.json({ agent: newAgent });
});



app.get('/api/tasks', (req, res) => {
  res.json({ tasks: [...tasks].sort((a, b) => {
    const pA = a.priority || 0;
    const pB = b.priority || 0;
    if (pA !== pB) return pB - pA;
    return b.createdAt - a.createdAt;
  }) });
});

app.post('/api/tasks/:id/priority', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.priority = req.body.priority || 0;
  res.json({ task });
});

app.post('/api/tasks', async (req, res) => {
  const { intent, routingMode } = req.body;
  if (!intent) {
    return res.status(400).json({ error: 'Intent is required' });
  }

  const task: Task = {
    id: `tsk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: intent.length > 50 ? intent.substring(0, 47) + '...' : intent,
    intent,
    status: 'planning',
    plan: null,
    activeStepIndex: -1,
    createdAt: Date.now()
  };
  
  tasks.push(task);
  res.json({ task });

  try {
    const ai = getAIClient();
    const prompt = `You are the DAOP Planner (Dynamic Agentic Orchestration Platform).
Given this user intent: "${intent}"

And these available tools/resources:
${JSON.stringify(resources, null, 2)}

Generate an execution sequence. Output ONLY a valid JSON array of objects representing the plan steps.
Do not wrap it in markdown. Do not include raw text outside JSON.
Each object must have:
{
  "id": "step_1",
  "toolName": "Name of the tool to use (or 'Manual Approval' / 'Data Transformation' for internal steps)",
  "rationale": "Why we are executing this step",
  "mockPayload": "An example payload or action detail",
  "humanApprovalRequired": boolean
}
Keep it robust and logical. Ensure human approval for sensitive actions like refunds.`;

    let modelName = 'gemini-3.5-flash';
    let config: any = { temperature: 0.2 };

    if (routingMode === 'fast') {
       modelName = 'gemini-3.1-flash-lite';
    } else if (routingMode === 'thinking') {
       modelName = 'gemini-3.1-pro-preview';
       config = {
         temperature: 0.2,
         thinkingConfig: { thinkingLevel: 'HIGH' }
       };
    } else if (routingMode === 'grounded') {
       modelName = 'gemini-3.5-flash';
       config.tools = [{ googleSearch: {} }];
    } else if (routingMode === 'maps') {
       modelName = 'gemini-3.5-flash';
       config.tools = [{ googleMaps: {} }];
    }

    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config
    });

    const text = result.text;
    if (!text) throw new Error('Failed to generate plan output');

    let plan = [];
    try {
      plan = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      plan = JSON.parse(cleaned);
    }

    task.plan = plan;
    task.status = 'running';
    task.activeStepIndex = 0;
    
    // Begin simulation
    simulateTaskExecution(task.id);

  } catch (error: any) {
    console.error('Task Planning Error:', error);
    task.status = 'failed';
    task.error = error.message;
  }
});

function simulateTaskExecution(taskId: string) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'running' || !task.plan) return;
  
  const step = task.plan[task.activeStepIndex];
  if (!step) {
    task.status = 'completed';
    return;
  }

  if (step.humanApprovalRequired) {
    task.status = 'paused';
    return;
  }

  setTimeout(() => {
    const t = tasks.find(curr => curr.id === taskId);
    if (!t || t.status !== 'running') return;
    
    // Simulate random failure (15% chance) OR if intent includes "fail"
    if (Math.random() < 0.15 || t.intent.toLowerCase().includes('fail')) {
      t.status = 'failed';
      t.error = `Agent encountered a runtime error executing: ${step.toolName}`;
      return;
    }

    t.activeStepIndex++;
    if (t.activeStepIndex >= t.plan!.length) {
      t.status = 'completed';
    } else {
      simulateTaskExecution(taskId);
    }
  }, 3000); // 3 seconds per simulated step
}

app.post('/api/tasks/bulk', (req, res) => {
  const { action, taskIds } = req.body;
  if (!Array.isArray(taskIds)) return res.status(400).json({ error: 'taskIds must be an array' });

  taskIds.forEach(taskId => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (action === 'pause' && task.status === 'running') {
      task.status = 'paused';
    } else if (action === 'resume' && task.status === 'paused') {
      task.status = 'running';
      simulateTaskExecution(task.id);
    } else if (action === 'cancel' && !['completed', 'failed'].includes(task.status)) {
      task.status = 'failed';
      task.error = 'Task cancelled by user';
    }
  });

  res.json({ success: true });
});

app.post('/api/tasks/:id/approve', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  
  if (task.status === 'paused') {
    task.status = 'running';
    task.activeStepIndex++;
    if (task.activeStepIndex >= task.plan!.length) {
      task.status = 'completed';
    } else {
      simulateTaskExecution(task.id);
    }
  }
  
  res.json({ task });
});

app.get('/api/agents/:id/metrics', (req, res) => {
  const { id } = req.params;
  
  // Generate deterministically random mock metrics for the past 7 days based on agent id
  const metrics = Array.from({ length: 7 }).map((_, i) => {
    const seed = id.charCodeAt(id.length - 1) + i;
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      latency: 200 + (Math.sin(seed) * 100) + (Math.random() * 50), // ms
      successRate: 85 + (Math.cos(seed) * 10) + (Math.random() * 5), // percentage
      tokens: 1000 + (Math.sin(seed * 2) * 500) + Math.random() * 200 // count
    };
  });
  
  res.json({ metrics });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, botId } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    const ai = getAIClient();

    // Map sender roles: 'user' keeps 'user', 'bot' / others map to 'model'
    const contents = messages.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Choose model and system instruction based on agent choice
    let modelName = 'gemini-3.5-flash';
    let systemInstruction = 'You are a professional assistant on the DAOP platform.';
    let config: any = {};

    if (botId === 'planner-bot') {
      modelName = 'gemini-3.5-flash';
      systemInstruction = 'You are Skyler, a brilliant Planning Architect on the DAOP (Dynamic Agentic Orchestration Platform). Your specialty is designing and explaining advanced workflows, explaining how intents translate to execution sequences of MCP servers, databases, and notification webhooks. Speak in a helpful tech-savvy tone, giving concrete examples of schemas, JSON payloads, and workflow best practices. Always keep your visual design palette in mind which is skyblue & white!';
    } else if (botId === 'data-bot') {
      modelName = 'gemini-3.1-pro-preview'; // Used for complex thinking
      systemInstruction = 'You are Nimbus, a meticulous Data Scientist and system optimizer. Your expertise includes SQL performance, robust schema creation, token budget allocation, and payload security auditing. You always provide deeply optimized JSON schemas and suggest improvements for database querying and metric collection. Act in a professional, authentic, senior database architect manner.';
      config.thinkingConfig = { thinkingLevel: 'HIGH' }; // High thinking mode
    } else if (botId === 'mcp-bot') {
      modelName = 'gemini-3.1-flash-lite'; // Fast low-latency tasks
      systemInstruction = 'You are Zippy, a low-latency, energetic Model Context Protocol (MCP) helper. You know everything about MCP transport layers, JSON-RPC messages, resource registries, and connecting external connectors (like Zendesk, Slack, or web searchers). Keep your responses punchy, fast, crisp, and direct to solve connection issues. Always suggest the exact mock URLs (e.g., http://localhost:4000/mcp) to help in the tutorial!';
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        ...config,
        systemInstruction
      }
    });

    const reply = response.text || "I apologize, but I couldn't process that response.";
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { intent, routingMode } = req.body;
    if (!intent) {
      return res.status(400).json({ error: 'Intent is required' });
    }

    const ai = getAIClient();

    const prompt = `You are the DAOP Planner (Dynamic Agentic Orchestration Platform).
Given this user intent: "${intent}"

And these available tools/resources:
${JSON.stringify(resources, null, 2)}

Generate an execution sequence. Output ONLY a valid JSON array of objects representing the plan steps.
Do not wrap it in markdown. Do not include raw text outside JSON.
Each object must have:
{
  "id": "step_1",
  "toolName": "Name of the tool to use (or 'Manual Approval' / 'Data Transformation' for internal steps)",
  "rationale": "Why we are executing this step",
  "mockPayload": "An example payload or action detail",
  "humanApprovalRequired": boolean
}
Keep it robust and logical. Ensure human approval for sensitive actions like refunds.`;

    let modelName = 'gemini-3.5-flash';
    let config: any = { temperature: 0.2 };

    if (routingMode === 'fast') {
       modelName = 'gemini-3.1-flash-lite';
    } else if (routingMode === 'thinking') {
       modelName = 'gemini-3.1-pro-preview';
       config = {
         temperature: 0.2,
         thinkingConfig: { thinkingLevel: 'HIGH' }
       };
    } else if (routingMode === 'grounded') {
       modelName = 'gemini-3.5-flash';
       config.tools = [{ googleSearch: {} }];
    } else if (routingMode === 'maps') {
       modelName = 'gemini-3.5-flash';
       config.tools = [{ googleMaps: {} }];
    }

    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config
    });

    const text = result.text;
    if (!text) {
      return res.status(500).json({ error: 'Failed to generate plan' });
    }

    // Try to parse the output as JSON
    let plan = [];
    try {
      plan = JSON.parse(text);
    } catch (e) {
      // Strip markdown if it wrapped it in ```json ... ```
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        plan = JSON.parse(cleaned);
      } catch(e2) {
         return res.status(500).json({ error: 'Could not parse generated workflow JSON', rawOutput: text });
      }
    }

    res.json({ workflow: plan });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Error processing request' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
