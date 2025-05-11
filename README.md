# elastic-socks-proxy

A distributed SOCKS proxy with worker support, built on top of nodejs-text-net.

## Overview

elastic-socks-proxy is a scalable SOCKS proxy implementation that can distribute connections across multiple worker processes, potentially running on different machines. It uses the text-based networking capabilities of nodejs-text-net to manage communication between the server and workers.

The architecture is similar to elastic-http-proxy but specifically designed for SOCKS protocol.

## Features

- SOCKS proxy server with support for distributed workers
- Automatic worker registration and management
- Connection load balancing across available workers
- Fallback to direct handling when no workers are available
- Environment-specific configuration
- Automatic reconnection for workers

## Installation

```bash
npm install @dongmuni/elastic-socks-proxy
```

## Usage

### Starting the Server

```bash
node index.js server
```

This starts the SOCKS proxy server that listens for client connections and distributes them to available workers.

### Starting a Worker

```bash
node index.js worker
```

This starts a worker process that connects to the server and handles SOCKS connections assigned to it.

## Configuration

The configuration is environment-aware and will load the appropriate config file based on the hostname:

- `config-local.js` - For local development
- `config-dev.js` - For development environment
- `config-live.js` - For production environment

### Server Configuration Options

```javascript
serverOptions: {
    // TextNet server options for worker communication
    textNetOptions: {
        port: 8081,          // Port for worker communication
        host: '0.0.0.0',     // Listen on all interfaces
        backlog: 1024,       // Connection backlog
        logConnection: true, // Log connection events
        logSession: false,   // Log session events
        idleCloseTimeout: 60000 // Close idle connections after 60 seconds
    },
    // SOCKS proxy options
    proxyOptions: {
        socksPort: 1080,     // SOCKS proxy port
        logEvent: false,     // Log general events
        logError: false,     // Log errors
        logAccess: true      // Log access
    }
}
```

### Worker Configuration Options

```javascript
workerOptions: {
    // TextNet client options for server communication
    textNetOptions: {
        serverAddresses: [
            { host: 'localhost', port: 8081 }
        ],
        autoRegister: true,       // Auto-register with server
        idlePingTimeout: 30000,   // Send ping every 30 seconds
        reconnectInterval: 3000,  // Reconnect every 3 seconds if disconnected
        logConnection: true,      // Log connection events
        logSession: false         // Log session events
    },
    // SOCKS proxy options
    proxyOptions: {
        logEvent: false,          // Log general events
        logError: false,          // Log errors
        logAccess: true           // Log access
    }
}
```

## Architecture

The elastic-socks-proxy consists of two main components:

1. **Server**: Listens for SOCKS client connections and distributes them to available workers. If no workers are available, it handles connections directly.

2. **Workers**: Connect to the server and handle SOCKS connections assigned to them. They establish connections to the requested destinations and proxy data between the client and destination.

Communication between the server and workers is handled using nodejs-text-net, which provides a reliable text-based protocol for message exchange and session management.

## Dependencies

- [@dongmuni/nodejs-util](https://github.com/dongmuni/nodejs-util): Utility functions
- [@dongmuni/nodejs-text-net](https://github.com/dongmuni/nodejs-text-net): Text-based networking library
- [socks](https://www.npmjs.com/package/socks): SOCKS protocol implementation

## License

ISC
