import { Request, Response } from 'express';

// Define types for MCP requests and responses
export interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// Resource types
export interface FileResource {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  created: Date;
  modified: Date;
}

export interface FilesResourceResponse {
  files: FileResource[];
}

// Tool response types
export interface ToolResponse {
  success: boolean;
  error?: string;
}

export interface ListDirectoryResponse extends ToolResponse {
  entries?: FileResource[];
}

export interface ReadFileResponse extends ToolResponse {
  content?: string;
  metadata?: {
    path: string;
    size: number;
    modified: Date;
  };
}

export interface WriteFileResponse extends ToolResponse {
  metadata?: {
    path: string;
    size: number;
    modified: Date;
  };
}

export interface SearchFilesResponse extends ToolResponse {
  matches?: FileResource[];
}

// Prompt response types
export interface PromptResponse extends ToolResponse {
  prompt?: string;
}

// Express handler with typed request/response
export type MCPRequestHandler = (req: Request, res: Response) => void | Promise<void>; 