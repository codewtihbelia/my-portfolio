import { Router, Request, Response } from 'express';

export const activityRouter = Router();

// In-memory buffer fallback for fast API logs
interface MemoryLog {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: string;
  source: string;
}

const memoryLogs: MemoryLog[] = [
  {
    id: 'init-1',
    action: 'service_start',
    resource: 'backend',
    timestamp: new Date().toISOString(),
    details: 'Backend API service initialized successfully on Render',
    source: 'system'
  }
];

activityRouter.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json({
    success: true,
    count: memoryLogs.length,
    logs: memoryLogs.slice(-limit).reverse()
  });
});

activityRouter.post('/', (req: Request, res: Response) => {
  const { action, resource, details } = req.body || {};
  if (!action || !resource) {
    return res.status(400).json({ success: false, error: 'action and resource are required.' });
  }

  const newLog: MemoryLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action: String(action),
    resource: String(resource),
    timestamp: new Date().toISOString(),
    details: details ? String(details) : undefined,
    source: 'client_api'
  };

  memoryLogs.push(newLog);
  if (memoryLogs.length > 200) {
    memoryLogs.shift();
  }

  res.status(201).json({ success: true, log: newLog });
});
