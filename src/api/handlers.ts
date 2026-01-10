/**
 * API handlers that wrap the existing CLI logic
 */

import type { Request, Response } from 'express';
import path from 'pathe';
import fs from 'node:fs';
import os from 'node:os';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { validateProgrammaticFlags as validateApplyFlags } from '../lib/load/apply-flags.js';
import apply from '../lib/load/index.js';
import extract from '../lib/extract/index.js';
import { initializeDirectusApi } from '../lib/utils/auth.js';
import { getLocalTemplate, getCommunityTemplates, getGithubTemplate } from '../lib/utils/get-template.js';
import { logger } from '../lib/utils/logger.js';
import type { ApplyTemplateRequest, ExtractTemplateRequest, ApiResponse, HealthResponse } from './types.js';
import { generatePackageJsonContent, generateReadmeContent } from '../lib/utils/template-defaults.js';
import { VERSION } from './constants.js';

/**
 * Create a tar archive from a directory
 */
async function createTarArchive(sourceDir: string, outputPath: string): Promise<void> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);
  
  // Use tar command to create archive
  await execAsync(`tar -cf "${outputPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`);
}

/**
 * Create a gzipped tar archive from a directory
 */
async function createTarGzArchive(sourceDir: string, outputPath: string): Promise<void> {
  const tarPath = outputPath.replace(/\.gz$/, '');
  
  // Create tar archive first
  await createTarArchive(sourceDir, tarPath);
  
  // Then gzip it
  const gzip = createGzip();
  const source = createReadStream(tarPath);
  const destination = createWriteStream(outputPath);
  
  await pipeline(source, gzip, destination);
  
  // Clean up the intermediate tar file
  fs.unlinkSync(tarPath);
}

/**
 * Recursively remove a directory
 */
function removeDirectory(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Helper function to build boolean defaults for flags
 * Returns an object where each field defaults to true unless explicitly set to false
 */
function buildBooleanDefaults(body: any, fields: string[]): Record<string, boolean> {
  return fields.reduce((acc, field) => {
    acc[field] = body[field] !== false;
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * Health check endpoint
 */
export async function healthCheck(req: Request, res: Response<HealthResponse>) {
  res.json({
    status: 'ok',
    version: VERSION,
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

    // Build flags object with defaults (all true unless explicitly set to false)
    const booleanFlags = buildBooleanDefaults(body, ['content', 'dashboards', 'extensions', 'files', 'flows', 'permissions', 'schema', 'settings', 'users']);
    const flags = {
      directusUrl: body.directusUrl,
      directusToken: body.directusToken || '',
      userEmail: body.userEmail || '',
      userPassword: body.userPassword || '',
      templateLocation: body.templateLocation,
      templateType,
      programmatic: true,
      partial: body.partial || false,
      content: booleanFlags.content,
      dashboards: booleanFlags.dashboards,
      extensions: booleanFlags.extensions,
      files: booleanFlags.files,
      flows: booleanFlags.flows,
      permissions: booleanFlags.permissions,
      schema: booleanFlags.schema,
      settings: booleanFlags.settings,
      users: booleanFlags.users,
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
 * 
 * Supports two modes:
 * 1. Save to disk: Provide templateLocation to save the extracted template to a directory
 * 2. Return archive: Set returnArchive=true to get a gzipped tar archive as the response
 */
export async function extractTemplate(req: Request, res: Response) {
  const body = req.body as ExtractTemplateRequest;
  let tempDir: string | null = null;

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

    if (!body.templateName) {
      return res.status(400).json({
        success: false,
        error: 'templateName is required',
      });
    }

    // If not returning archive, templateLocation is required
    if (!body.returnArchive && !body.templateLocation) {
      return res.status(400).json({
        success: false,
        error: 'templateLocation is required when returnArchive is not set',
      });
    }

    // Initialize Directus API
    await initializeDirectusApi({
      directusUrl: body.directusUrl,
      directusToken: body.directusToken,
      userEmail: body.userEmail,
      userPassword: body.userPassword,
    });

    // Determine the directory to use
    let directory: string;
    
    if (body.returnArchive) {
      // Create a temporary directory for extraction
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'directus-template-'));
      directory = path.join(tempDir, body.templateName);
      fs.mkdirSync(directory, { recursive: true });
    } else {
      directory = path.resolve(body.templateLocation!);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    }

    // Generate package.json and README
    const packageJSONContent = generatePackageJsonContent(body.templateName);
    const readmeContent = generateReadmeContent(body.templateName);

    const packageJSONPath = path.join(directory, 'package.json');
    const readmePath = path.join(directory, 'README.md');

    fs.writeFileSync(packageJSONPath, packageJSONContent);
    fs.writeFileSync(readmePath, readmeContent);

    // Build extract flags with defaults (all true unless explicitly set to false)
    const extractBooleanFlags = buildBooleanDefaults(body, ['content', 'dashboards', 'extensions', 'files', 'flows', 'permissions', 'schema', 'settings', 'users']);

    // Extract the template
    await extract(directory, extractBooleanFlags);

    // If returning archive, create gzip and send it
    if (body.returnArchive) {
      const archivePath = path.join(tempDir!, `${body.templateName}.tar.gz`);
      
      await createTarGzArchive(directory, archivePath);
      
      const archiveBuffer = fs.readFileSync(archivePath);
      
      if (body.archiveFormat === 'base64') {
        // Return as JSON with base64-encoded archive
        res.json({
          success: true,
          message: 'Template extracted successfully',
          data: {
            templateName: body.templateName,
            filename: `${body.templateName}.tar.gz`,
            contentType: 'application/gzip',
            size: archiveBuffer.length,
            archive: archiveBuffer.toString('base64'),
          },
        });
      } else {
        // Return as binary download (default)
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${body.templateName}.tar.gz"`);
        res.setHeader('Content-Length', archiveBuffer.length);
        res.send(archiveBuffer);
      }
      
      // Clean up temp directory
      removeDirectory(tempDir!);
      return;
    }

    // Standard response for disk save mode
    res.json({
      success: true,
      message: 'Template extracted successfully',
      data: {
        templateName: body.templateName,
        templateLocation: body.templateLocation,
      },
    });
  } catch (error) {
    // Clean up temp directory on error
    if (tempDir) {
      removeDirectory(tempDir);
    }
    
    logger.log('error', 'Error extracting template', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
