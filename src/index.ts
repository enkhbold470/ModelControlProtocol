import express from 'express';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import {
  MCPRequest,
  MCPResponse,
  ListDirectoryResponse,
  ReadFileResponse,
  WriteFileResponse,
  SearchFilesResponse,
  PromptResponse
} from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Define the dedicated MCP data folder
const MCP_DATA_FOLDER = path.resolve(process.cwd(), 'mcp-data');

// Ensure MCP data folder exists
if (!fs.existsSync(MCP_DATA_FOLDER)) {
  fs.mkdirSync(MCP_DATA_FOLDER, { recursive: true });
}

// Middleware to parse JSON requests
app.use(express.json());

// MCP server metadata endpoint
app.get('/mcp-info', (_req: Request, res: Response) => {
  res.json({
    name: "File System MCP Server",
    version: "1.0.0",
    description: "A simple MCP server for file system operations",
    resources: [
      {
        id: "files",
        name: "Files",
        description: "Access to the file system"
      },
      {
        id: "mcp-data",
        name: "MCP Data",
        description: "Access to the dedicated MCP data folder"
      }
    ],
    tools: [
      {
        id: "list-directory",
        name: "List Directory",
        description: "List files in a directory",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the directory"
            }
          },
          required: ["path"]
        }
      },
      {
        id: "read-file",
        name: "Read File",
        description: "Read the contents of a file",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the file"
            }
          },
          required: ["path"]
        }
      },
      {
        id: "write-file",
        name: "Write File",
        description: "Write content to a file",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the file"
            },
            content: {
              type: "string",
              description: "Content to write"
            }
          },
          required: ["path", "content"]
        }
      },
      {
        id: "search-files",
        name: "Search Files",
        description: "Search for files matching a pattern",
        parameters: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory to search in"
            },
            pattern: {
              type: "string",
              description: "Search pattern (glob format)"
            }
          },
          required: ["directory", "pattern"]
        }
      },
      {
        id: "mcp-data-list",
        name: "List MCP Data",
        description: "List files in the MCP data folder",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        id: "mcp-data-read",
        name: "Read MCP Data File",
        description: "Read a file from the MCP data folder",
        parameters: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file in the MCP data folder"
            }
          },
          required: ["filename"]
        }
      },
      {
        id: "mcp-data-write",
        name: "Write MCP Data File",
        description: "Write content to a file in the MCP data folder",
        parameters: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file in the MCP data folder"
            },
            content: {
              type: "string",
              description: "Content to write"
            }
          },
          required: ["filename", "content"]
        }
      }
    ],
    prompts: [
      {
        id: "file-operations",
        name: "File Operations",
        description: "Prompt template for file operations",
        template: "Perform the following file operation: {{operation}} on {{path}}."
      }
    ]
  });
});

// Handle JSON-RPC requests
app.post('/mcp-rpc', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body as MCPRequest;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    } as MCPResponse);
  }

  try {
    let result;

    switch (method) {
      case 'resources.get':
        if (params.resource === 'files') {
          result = handleFilesResource(params);
        } else if (params.resource === 'mcp-data') {
          result = handleMCPDataResource();
        } else {
          throw new Error(`Unknown resource: ${params.resource}`);
        }
        break;
      
      case 'tools.execute':
        switch (params.tool) {
          case 'list-directory':
            result = await listDirectory(params.args.path);
            break;
          case 'read-file':
            result = await readFile(params.args.path);
            break;
          case 'write-file':
            result = await writeFile(params.args.path, params.args.content);
            break;
          case 'search-files':
            result = await searchFiles(params.args.directory, params.args.pattern);
            break;
          case 'mcp-data-list':
            result = await listMCPDataFolder();
            break;
          case 'mcp-data-read':
            result = await readMCPDataFile(params.args.filename);
            break;
          case 'mcp-data-write':
            result = await writeMCPDataFile(params.args.filename, params.args.content);
            break;
          default:
            throw new Error(`Unknown tool: ${params.tool}`);
        }
        break;
      
      case 'prompts.render':
        if (params.prompt === 'file-operations') {
          result = renderFileOperationsPrompt(params.args);
        } else {
          throw new Error(`Unknown prompt: ${params.prompt}`);
        }
        break;
      
      default:
        throw new Error(`Unknown method: ${method}`);
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result
    } as MCPResponse);
  } catch (error: any) {
    console.error('Error handling request:', error);
    
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message || 'Internal error'
      }
    } as MCPResponse);
  }
});

// Implement file system resource handler
function handleFilesResource(params: any) {
  // In a real implementation, you would add authentication and validation
  const basePath = params.path ? path.resolve(params.path) : process.cwd();
  const entries = fs.readdirSync(basePath);
  
  return {
    files: entries.map(entry => {
      const fullPath = path.join(basePath, entry);
      const stats = fs.statSync(fullPath);
      
      return {
        name: entry,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    })
  };
}

// Implement MCP data resource handler
function handleMCPDataResource() {
  const entries = fs.readdirSync(MCP_DATA_FOLDER);
  
  return {
    files: entries.map(entry => {
      const fullPath = path.join(MCP_DATA_FOLDER, entry);
      const stats = fs.statSync(fullPath);
      
      return {
        name: entry,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    })
  };
}

// Implement tool functions
async function listDirectory(dirPath: string): Promise<ListDirectoryResponse> {
  const absolutePath = path.resolve(dirPath);
  
  try {
    const entries = fs.readdirSync(absolutePath);
    
    return {
      success: true,
      entries: entries.map(entry => {
        const fullPath = path.join(absolutePath, entry);
        const stats = fs.statSync(fullPath);
        
        return {
          name: entry,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function readFile(filePath: string): Promise<ReadFileResponse> {
  const absolutePath = path.resolve(filePath);
  
  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    
    return {
      success: true,
      content,
      metadata: {
        path: absolutePath,
        size: fs.statSync(absolutePath).size,
        modified: fs.statSync(absolutePath).mtime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function writeFile(filePath: string, content: string): Promise<WriteFileResponse> {
  const absolutePath = path.resolve(filePath);
  
  try {
    fs.writeFileSync(absolutePath, content, 'utf8');
    
    return {
      success: true,
      metadata: {
        path: absolutePath,
        size: fs.statSync(absolutePath).size,
        modified: fs.statSync(absolutePath).mtime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// MCP data specific functions
async function listMCPDataFolder(): Promise<ListDirectoryResponse> {
  try {
    const entries = fs.readdirSync(MCP_DATA_FOLDER);
    
    return {
      success: true,
      entries: entries.map(entry => {
        const fullPath = path.join(MCP_DATA_FOLDER, entry);
        const stats = fs.statSync(fullPath);
        
        return {
          name: entry,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function readMCPDataFile(filename: string): Promise<ReadFileResponse> {
  const filePath = path.join(MCP_DATA_FOLDER, filename);
  
  try {
    // Check that the file is within the MCP data folder (prevent path traversal)
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(MCP_DATA_FOLDER)) {
      throw new Error('Access denied: Cannot access files outside the MCP data folder');
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      success: true,
      content,
      metadata: {
        path: filePath,
        size: fs.statSync(filePath).size,
        modified: fs.statSync(filePath).mtime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function writeMCPDataFile(filename: string, content: string): Promise<WriteFileResponse> {
  const filePath = path.join(MCP_DATA_FOLDER, filename);
  
  try {
    // Check that the file is within the MCP data folder (prevent path traversal)
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(MCP_DATA_FOLDER)) {
      throw new Error('Access denied: Cannot write files outside the MCP data folder');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    return {
      success: true,
      metadata: {
        path: filePath,
        size: fs.statSync(filePath).size,
        modified: fs.statSync(filePath).mtime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// New search files function
async function searchFiles(directory: string, pattern: string): Promise<SearchFilesResponse> {
  const absolutePath = path.resolve(directory);
  
  try {
    // Simple implementation using glob pattern matching
    // In a real implementation, you would use a proper glob library
    const entries = fs.readdirSync(absolutePath);
    const matchingEntries = entries.filter(entry => {
      // Very basic pattern matching (just for demonstration)
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(entry);
      }
      return entry.includes(pattern);
    });
    
    return {
      success: true,
      matches: matchingEntries.map(entry => {
        const fullPath = path.join(absolutePath, entry);
        const stats = fs.statSync(fullPath);
        
        return {
          name: entry,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Prompt rendering function
function renderFileOperationsPrompt(args: any): PromptResponse {
  if (!args.operation || !args.path) {
    return {
      success: false,
      error: "Missing required arguments: operation and path"
    };
  }
  
  return {
    success: true,
    prompt: `Perform the following file operation: ${args.operation} on ${args.path}.`
  };
}

// Start the server
app.listen(PORT, () => {
  console.log(`MCP File System server running at http://localhost:${PORT}`);
  console.log(`Server metadata available at http://localhost:${PORT}/mcp-info`);
  console.log(`MCP data folder located at: ${MCP_DATA_FOLDER}`);
}); 