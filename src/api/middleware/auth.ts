/**
 * Authentication middleware for the API
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/utils/logger.js';

/**
 * Get the API token from environment variables
 * Returns undefined if no token is configured (auth disabled)
 */
export function getApiToken(): string | undefined {
  return process.env.API_AUTH_TOKEN;
}

/**
 * Check if authentication is enabled
 */
export function isAuthEnabled(): boolean {
  const token = getApiToken();
  return Boolean(token && token.trim().length > 0);
}

/**
 * Authentication middleware
 * Validates the Authorization header against the configured API token
 * 
 * Supports:
 * - Bearer token: Authorization: Bearer <token>
 * - Direct token: Authorization: <token>
 * - X-API-Key header: X-API-Key: <token>
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiToken = getApiToken();

  // If no API token is configured, skip authentication
  if (!apiToken || apiToken.trim().length === 0) {
    return next();
  }

  // Extract token from request
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  let providedToken: string | undefined;

  if (authHeader) {
    // Support both "Bearer <token>" and direct "<token>" formats
    if (authHeader.startsWith('Bearer ')) {
      providedToken = authHeader.slice(7);
    } else {
      providedToken = authHeader;
    }
  } else if (apiKeyHeader) {
    providedToken = apiKeyHeader;
  }

  // Validate token
  if (!providedToken) {
    logger.log('warn', 'Auth middleware: No authentication token provided');
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is required. Provide it via Authorization header or X-API-Key header.',
    });
    return;
  }

  if (providedToken !== apiToken) {
    logger.log('warn', 'Auth middleware: Invalid authentication token');
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid authentication token.',
    });
    return;
  }

  logger.log('info', 'Auth middleware: Authentication successful');
  next();
}
