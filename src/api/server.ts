/**
 * Express API server for Directus Template CLI
 */

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { healthCheck, applyTemplate, extractTemplate } from './handlers.js';
import { logger } from '../lib/utils/logger.js';
import { VERSION } from './constants.js';

/**
 * Create and configure the Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.log('info', `${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.get('/health', healthCheck);
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Directus Template CLI API',
      version: VERSION,
      endpoints: {
        health: 'GET /health',
        apply: 'POST /api/apply',
        extract: 'POST /api/extract',
      },
    });
  });

  // API routes
  app.post('/api/apply', applyTemplate);
  app.post('/api/extract', extractTemplate);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.log('error', 'Unhandled error', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  return app;
}

/**
 * Start the server
 */
export function startServer(port: number = 3000): void {
  const app = createApp();

  app.listen(port, () => {
    console.log(`\n🚀 Directus Template CLI API Server`);
    console.log(`📡 Server running on http://localhost:${port}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /              - API information`);
    console.log(`  GET  /health        - Health check`);
    console.log(`  POST /api/apply     - Apply a template`);
    console.log(`  POST /api/extract   - Extract a template`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
  });
}

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 3000;
  startServer(port);
}
