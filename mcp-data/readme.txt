# MCP Data Folder

This folder is dedicated to storing data files that are managed by the Model Context Protocol (MCP) server.

## Purpose

- Store data files that need to be accessed by AI models through the MCP server
- Keep MCP-managed files isolated from other project files
- Provide a secure, controlled environment for file operations

## Usage

Files in this folder can be accessed using the following MCP tools:

1. `mcp-data-list` - List all files in the MCP data folder
2. `mcp-data-read` - Read the content of a file in the MCP data folder
3. `mcp-data-write` - Write content to a file in the MCP data folder

## Example

To create a JSON data file in this folder, use the `mcp-data-write` tool:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools.execute",
  "params": {
    "tool": "mcp-data-write",
    "args": {
      "filename": "example.json",
      "content": "{\"name\": \"Example\", \"value\": 42}"
    }
  }
}
```

Then read it using the `mcp-data-read` tool:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools.execute",
  "params": {
    "tool": "mcp-data-read",
    "args": {
      "filename": "example.json"
    }
  }
}
```

Note: The MCP server includes security measures to prevent accessing files outside this folder. 