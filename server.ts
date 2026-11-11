import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { healthRouter } from './server/routes/health';
import { contactRouter } from './server/routes/contact';
import { activityRouter } from './server/routes/activity';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS so the Render Static Site frontend can communicate with this backend service
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes FIRST
app.use('/api/health', healthRouter);
app.use('/api/contact', contactRouter);
app.use('/api/activity', activityRouter);

// API 404 Fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware handles client HMR & SPA serving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode:
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      // Full-stack / Static serving
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      // Standalone backend mode on Render
      app.get('/', (req, res) => {
        res.json({
          service: 'Portfolio Backend Service',
          status: 'online',
          endpoints: ['/api/health', '/api/contact', '/api/activity'],
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
