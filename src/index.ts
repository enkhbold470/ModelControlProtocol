import express from 'express';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import {
  MCPRequest,
  MCPResponse,
  ListDirectoryResponse,
  ReadFileResponse,
  WriteFileResponse
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
    name: "MCP Data Server",
    version: "1.0.0",
    description: "A simple MCP server for MCP data folder operations",
    resources: [
      {
        id: "mcp-data",
        name: "MCP Data",
        description: "Access to the dedicated MCP data folder"
      }
    ],
    tools: [
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
        if (params.resource === 'mcp-data') {
          result = handleMCPDataResource();
        } else {
          throw new Error(`Unknown resource: ${params.resource}`);
        }
        break;
      
      case 'tools.execute':
        switch (params.tool) {
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

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Data Server running at http://localhost:${PORT}`);
  console.log(`Server metadata available at http://localhost:${PORT}/mcp-info`);
  console.log(`MCP data folder located at: ${MCP_DATA_FOLDER}`);
}); 