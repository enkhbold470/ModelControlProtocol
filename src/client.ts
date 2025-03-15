import fetch from 'node-fetch';
import * as process from 'process';
import {
  MCPRequest,
  MCPResponse,
  ListDirectoryResponse,
  ReadFileResponse,
  WriteFileResponse,
  SearchFilesResponse,
  PromptResponse
} from './types';

// Define MCP client class
class MCPClient {
  private baseUrl: string;
  private requestId: number = 1;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Fetch server metadata
  async getServerInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp-info`);
    return await response.json();
  }

  // Make a JSON-RPC request to the server
  async call(method: string, params: any): Promise<any> {
    const id = this.requestId++;
    
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    const response = await fetch(`${this.baseUrl}/mcp-rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const result = await response.json() as MCPResponse;
    
    if (result.error) {
      throw new Error(`MCP error: ${result.error.message}`);
    }
    
    return result.result;
  }

  // Get a resource
  async getResource(resourceId: string, params: any = {}): Promise<any> {
    return this.call('resources.get', { resource: resourceId, ...params });
  }

  // Execute a tool
  async executeTool(toolId: string, args: any): Promise<any> {
    return this.call('tools.execute', { tool: toolId, args });
  }

  // Render a prompt
  async renderPrompt(promptId: string, args: any): Promise<PromptResponse> {
    return this.call('prompts.render', { prompt: promptId, args });
  }

  // List directory contents
  async listDirectory(dirPath: string): Promise<ListDirectoryResponse> {
    return this.executeTool('list-directory', { path: dirPath });
  }

  // Read file contents
  async readFile(filePath: string): Promise<ReadFileResponse> {
    return this.executeTool('read-file', { path: filePath });
  }

  // Write content to a file
  async writeFile(filePath: string, content: string): Promise<WriteFileResponse> {
    return this.executeTool('write-file', { path: filePath, content });
  }

  // Search for files
  async searchFiles(directory: string, pattern: string): Promise<SearchFilesResponse> {
    return this.executeTool('search-files', { directory, pattern });
  }

  // Get file operations prompt
  async getFileOperationsPrompt(operation: string, path: string): Promise<PromptResponse> {
    return this.renderPrompt('file-operations', { operation, path });
  }

  // MCP Data Folder specific methods
  async getMCPDataResource(): Promise<any> {
    return this.getResource('mcp-data');
  }

  async listMCPDataFolder(): Promise<ListDirectoryResponse> {
    return this.executeTool('mcp-data-list', {});
  }

  async readMCPDataFile(filename: string): Promise<ReadFileResponse> {
    return this.executeTool('mcp-data-read', { filename });
  }

  async writeMCPDataFile(filename: string, content: string): Promise<WriteFileResponse> {
    return this.executeTool('mcp-data-write', { filename, content });
  }
}

// Example usage
async function main(): Promise<void> {
  const client = new MCPClient('http://localhost:3000');

  try {
    // Get server metadata
    console.log('Getting server info...');
    const serverInfo = await client.getServerInfo();
    console.log('Server info:', JSON.stringify(serverInfo, null, 2));
    
    // Get files resource
    console.log('\nGetting files resource...');
    const filesResource = await client.getResource('files');
    console.log('Files:', JSON.stringify(filesResource, null, 2));
    
    // List the current directory
    console.log('\nListing current directory...');
    const dirContents = await client.listDirectory(process.cwd());
    console.log('Directory contents:', JSON.stringify(dirContents, null, 2));
    
    // Create a test file
    const testFilePath = './test-file.txt';
    console.log(`\nCreating test file at ${testFilePath}...`);
    const writeResult = await client.writeFile(testFilePath, 'Hello from MCP client!');
    console.log('Write result:', JSON.stringify(writeResult, null, 2));
    
    // Read the test file
    console.log(`\nReading test file from ${testFilePath}...`);
    const readResult = await client.readFile(testFilePath);
    console.log('Read result:', JSON.stringify(readResult, null, 2));
    
    // Search for files
    console.log('\nSearching for files...');
    const searchResult = await client.searchFiles(process.cwd(), '*.json');
    console.log('Search result:', JSON.stringify(searchResult, null, 2));
    
    // Render a prompt
    console.log('\nRendering file operations prompt...');
    const promptResult = await client.getFileOperationsPrompt('read', testFilePath);
    console.log('Prompt result:', JSON.stringify(promptResult, null, 2));

    // Test MCP Data folder operations
    console.log('\n===== MCP DATA FOLDER OPERATIONS =====');
    
    // Get MCP data folder resource
    console.log('\nGetting MCP data resource...');
    const mcpDataResource = await client.getMCPDataResource();
    console.log('MCP Data resource:', JSON.stringify(mcpDataResource, null, 2));
    
    // List MCP data folder
    console.log('\nListing MCP data folder...');
    const mcpDataContents = await client.listMCPDataFolder();
    console.log('MCP Data contents:', JSON.stringify(mcpDataContents, null, 2));
    
    // Create a test file in MCP data folder
    const testMCPFile = 'example-data.json';
    const testData = JSON.stringify({
      name: "Example Data",
      description: "This is an example data file in the MCP data folder",
      timestamp: new Date().toISOString(),
      values: [1, 2, 3, 4, 5]
    }, null, 2);
    
    console.log(`\nCreating test file in MCP data folder: ${testMCPFile}...`);
    const mcpWriteResult = await client.writeMCPDataFile(testMCPFile, testData);
    console.log('Write result:', JSON.stringify(mcpWriteResult, null, 2));
    
    // Read the test file from MCP data folder
    console.log(`\nReading test file from MCP data folder: ${testMCPFile}...`);
    const mcpReadResult = await client.readMCPDataFile(testMCPFile);
    console.log('Read result content:', mcpReadResult.content);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 