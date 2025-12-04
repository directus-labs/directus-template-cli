#!/usr/bin/env node

/**
 * Entry point for the API server
 * This allows running the API server independently from the CLI
 */

import { startServer } from '../dist/api/server.js';

const port = Number(process.env.PORT) || 3000;
startServer(port);
