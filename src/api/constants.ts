/**
 * API constants
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'pathe';

// Read version from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const VERSION = packageJson.version || '0.0.0';
