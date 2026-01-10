/**
 * API request and response types for the Express server
 */

export interface ApplyTemplateRequest {
  directusUrl: string;
  directusToken?: string;
  userEmail?: string;
  userPassword?: string;
  templateLocation: string;
  templateType?: 'community' | 'local' | 'github';
  partial?: boolean;
  content?: boolean;
  dashboards?: boolean;
  extensions?: boolean;
  files?: boolean;
  flows?: boolean;
  permissions?: boolean;
  schema?: boolean;
  settings?: boolean;
  users?: boolean;
}

export interface ExtractTemplateRequest {
  directusUrl: string;
  directusToken?: string;
  userEmail?: string;
  userPassword?: string;
  templateLocation?: string;
  templateName: string;
  /** If true, returns the template as a gzipped tar archive instead of saving to disk */
  returnArchive?: boolean;
  /** Format for archive response: 'binary' (default) or 'base64' */
  archiveFormat?: 'binary' | 'base64';
  /** Partial extraction flags - all default to true unless explicitly set to false */
  content?: boolean;
  dashboards?: boolean;
  extensions?: boolean;
  files?: boolean;
  flows?: boolean;
  permissions?: boolean;
  schema?: boolean;
  settings?: boolean;
  users?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: 'ok';
  version: string;
  timestamp: string;
}
