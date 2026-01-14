type ExtensionType = 'bundle' | 'interface' | 'module' | 'operation' | 'panel';

export interface ExtensionMeta {
  bundle: null | string;
  enabled: boolean;
  folder: string;
  id: string;
  source: 'local' | 'registry';
}

export interface ExtensionSchema {
  entries?: Array<{
    name: string;
    type: ExtensionType;
  }>;
  entrypoint: string | {
    api: string;
    app: string;
  };
  host: string;
  local: boolean;
  name: string;
  path: string;
  sandbox?: {
    enabled: boolean;
    requestedScopes: {
      log: Record<string, unknown>;
      request?: {
        methods: string[];
        urls: string[];
      };
    };
  };
  type: ExtensionType;
  version: string;
}

export interface Extension {
  bundle: null | string;
  id: string;
  meta: ExtensionMeta;
  schema: ExtensionSchema;
}

export type Extensions = Extension[];
