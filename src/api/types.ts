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
  templateLocation: string;
  templateName: string;
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
