// WebMCP Imperative API type declarations
// Spec: https://github.com/explainers-by-googlers/web-mcp

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, WebMCPProperty>;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface WebMCPProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: WebMCPProperty;
}

export interface WebMCPTools {
  register: (tool: WebMCPToolDefinition) => Promise<void>;
}

declare global {
  interface Navigator {
    tools?: WebMCPTools;
  }
}
