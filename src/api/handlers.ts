/**
 * API handlers that wrap the existing CLI logic
 */

import type { Request, Response } from 'express';
import path from 'pathe';
import fs from 'node:fs';
import { validateProgrammaticFlags as validateApplyFlags } from '../lib/load/apply-flags.js';
import apply from '../lib/load/index.js';
import extract from '../lib/extract/index.js';
import { initializeDirectusApi } from '../lib/utils/auth.js';
import { getLocalTemplate, getCommunityTemplates, getGithubTemplate } from '../lib/utils/get-template.js';
import { logger } from '../lib/utils/logger.js';
import type { ApplyTemplateRequest, ExtractTemplateRequest, ApiResponse, HealthResponse } from './types.js';
import { generatePackageJsonContent, generateReadmeContent } from '../lib/utils/template-defaults.js';

/**
 * Health check endpoint
 */
export async function healthCheck(req: Request, res: Response<HealthResponse>) {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '0.7.4',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Apply template endpoint
 */
export async function applyTemplate(req: Request, res: Response<ApiResponse>) {
  const body = req.body as ApplyTemplateRequest;

  try {
    // Validate required fields
    if (!body.directusUrl) {
      return res.status(400).json({
        success: false,
        error: 'directusUrl is required',
      });
    }

    if (!body.directusToken && (!body.userEmail || !body.userPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Either directusToken or both userEmail and userPassword are required',
      });
    }

    if (!body.templateLocation) {
      return res.status(400).json({
        success: false,
        error: 'templateLocation is required',
      });
    }

    // Initialize Directus API
    await initializeDirectusApi({
      directusUrl: body.directusUrl,
      directusToken: body.directusToken,
      userEmail: body.userEmail,
      userPassword: body.userPassword,
    });

    // Get template based on type
    let templateDir: string;
    const templateType = body.templateType || 'local';

    if (templateType === 'local') {
      const template = await getLocalTemplate(body.templateLocation);
      templateDir = template.directoryPath;
    } else if (templateType === 'community') {
      const templates = await getCommunityTemplates();
      const template = templates.find(t => t.templateName === body.templateLocation);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: `Template '${body.templateLocation}' not found in community templates`,
        });
      }
      templateDir = template.directoryPath;
    } else if (templateType === 'github') {
      const template = await getGithubTemplate(body.templateLocation);
      templateDir = template.directoryPath;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid templateType. Must be "local", "community", or "github"',
      });
    }

    // Build flags object
    const flags = {
      directusUrl: body.directusUrl,
      directusToken: body.directusToken,
      userEmail: body.userEmail,
      userPassword: body.userPassword,
      templateLocation: body.templateLocation,
      templateType,
      programmatic: true,
      partial: body.partial || false,
      content: body.content !== false,
      dashboards: body.dashboards !== false,
      extensions: body.extensions !== false,
      files: body.files !== false,
      flows: body.flows !== false,
      permissions: body.permissions !== false,
      schema: body.schema !== false,
      settings: body.settings !== false,
      users: body.users !== false,
    };

    // Validate flags using existing validation
    const validatedFlags = await validateApplyFlags(flags);

    // Apply the template
    await apply(templateDir, validatedFlags);

    res.json({
      success: true,
      message: 'Template applied successfully',
      data: {
        templateLocation: body.templateLocation,
        templateType,
      },
    });
  } catch (error) {
    logger.log('error', 'Error applying template', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

/**
 * Extract template endpoint
 */
export async function extractTemplate(req: Request, res: Response<ApiResponse>) {
  const body = req.body as ExtractTemplateRequest;

  try {
    // Validate required fields
    if (!body.directusUrl) {
      return res.status(400).json({
        success: false,
        error: 'directusUrl is required',
      });
    }

    if (!body.directusToken && (!body.userEmail || !body.userPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Either directusToken or both userEmail and userPassword are required',
      });
    }

    if (!body.templateLocation) {
      return res.status(400).json({
        success: false,
        error: 'templateLocation is required',
      });
    }

    if (!body.templateName) {
      return res.status(400).json({
        success: false,
        error: 'templateName is required',
      });
    }

    // Initialize Directus API
    await initializeDirectusApi({
      directusUrl: body.directusUrl,
      directusToken: body.directusToken,
      userEmail: body.userEmail,
      userPassword: body.userPassword,
    });

    // Create template directory
    const directory = path.resolve(body.templateLocation);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Generate package.json and README
    const packageJSONContent = generatePackageJsonContent(body.templateName);
    const readmeContent = generateReadmeContent(body.templateName);

    const packageJSONPath = path.join(directory, 'package.json');
    const readmePath = path.join(directory, 'README.md');

    fs.writeFileSync(packageJSONPath, packageJSONContent);
    fs.writeFileSync(readmePath, readmeContent);

    // Extract the template
    await extract(directory);

    res.json({
      success: true,
      message: 'Template extracted successfully',
      data: {
        templateName: body.templateName,
        templateLocation: body.templateLocation,
      },
    });
  } catch (error) {
    logger.log('error', 'Error extracting template', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
