# MCP Filesystem Demo

A simple implementation of the Model Context Protocol (MCP) for file system operations. This project demonstrates how to create an MCP server that exposes file system resources and tools through a standardized protocol.

## What is Model Context Protocol?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables seamless integration between AI assistants (like Claude) and external data sources. MCP provides a standardized way for AI models to access and manipulate data in various systems.

## Features

This demo implements a simple MCP server with:

- **Resources**: File system metadata access
- **Tools**: Directory listing, file reading, file writing, and file searching operations
- **Prompts**: Template-based prompts for file operations

## Components of MCP

MCP servers act as bridges between AI models and external tools/resources:

1. **Protocol Standardization**: Implements a consistent communication format using JSON-RPC 2.0
2. **Resources**: Provides access to data sources (files, databases, APIs)
3. **Tools**: Enables AI models to execute specific functions (read/write/search)
4. **Prompts**: Defines reusable templates for interactions

## Getting Started

### Prerequisites

- Node.js (14+)
- npm or yarn

### Installation

1. Clone this repository or download the code
2. Install dependencies:

```bash
npm install
```

### Running the Server

Start the MCP server:

```bash
npm run dev
```

The server will run at http://localhost:3000 by default. You can verify the server is running by visiting http://localhost:3000/mcp-info in your browser.

### Running the Client

This demo includes a sample client that shows how to interact with the MCP server:

```bash
npm run client
```

This will:

1. Get server metadata
2. List files in the current directory
3. Create a test file
4. Read the contents of the test file
5. Search for files matching a pattern
6. Render a file operations prompt

### Testing with Postman

A Postman collection is included (`mcp-postman-collection.json`) that you can import into Postman to test the API:

1. Import the collection in Postman
2. Make sure the server is running
3. Try the different requests:
   - Get Server Info
   - Get Files Resource
   - List Directory
   - Read File
   - Write File

## Project Structure

- `src/index.ts` - MCP server implementation
- `src/client.ts` - Sample client demonstrating how to use the MCP server
- `mcp-postman-collection.json` - Postman collection for API testing

## MCP Protocol Details

This implementation uses:

- JSON-RPC 2.0 for communication
- HTTP as the transport layer
- Three main methods:
  - `resources.get` - For retrieving data
  - `tools.execute` - For performing actions
  - `prompts.render` - For generating prompts from templates

## MCP Server Types

Many MCP servers are available for different purposes:

- **File Systems**: Access to local files (this demo)
- **Databases**: SQL and NoSQL database access (PostgreSQL, MongoDB)
- **APIs**: Integration with web services and APIs
- **Memory**: Persistent memory systems for AI models
- **Search**: Integration with search engines
- **Knowledge Bases**: Access to structured knowledge

## Security Considerations

This demo is for educational purposes only and includes minimal security measures. In a production environment, you would need to add:

- Authentication and authorization
- Input validation
- Path traversal protection
- Rate limiting
- Logging and audit trails

## References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [MCP Specification](https://spec.modelcontextprotocol.io/specification/)
