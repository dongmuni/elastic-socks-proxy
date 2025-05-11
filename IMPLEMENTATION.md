# elastic-socks-proxy Implementation Details

## Project Structure

The elastic-socks-proxy project has been implemented with the following structure:

```
elastic-socks-proxy/
├── package.json         # Project metadata and dependencies
├── index.js             # Main entry point with server and worker implementations
├── config.js            # Environment detection and configuration loading
├── config-local.js      # Configuration for local development
└── README.md            # Project documentation
```

## Implementation Overview

The implementation follows a similar pattern to elastic-http-proxy but is adapted for the SOCKS protocol. It uses nodejs-text-net for communication between the server and workers, allowing for distributed operation.

### Key Components

1. **Server Mode**
   - Creates a SOCKS server using the 'socks' library
   - Sets up a TextNet server for worker communication
   - Manages a worker pool for distributing connections
   - Handles connections directly if no workers are available
   - Distributes connections to workers when available

2. **Worker Mode**
   - Connects to the server using TextNet
   - Registers itself as a worker
   - Handles SOCKS sessions assigned by the server
   - Establishes connections to requested destinations
   - Proxies data between the client and destination

3. **Configuration System**
   - Environment-aware configuration loading
   - Separate configurations for server and worker modes
   - Configurable ports, logging, and timeouts

## How It Works

1. **Server Operation**
   - The server listens for SOCKS client connections on the configured port (default: 1080)
   - When a client connects, the server selects a worker from the pool
   - The server creates a session with the worker and passes the connection details
   - If no workers are available, the server handles the connection directly

2. **Worker Operation**
   - Workers connect to the server and register themselves
   - When assigned a session, the worker establishes a connection to the requested destination
   - The worker then proxies data between the session and the destination
   - If the connection fails, the worker reports the error back to the server

3. **Communication Protocol**
   - Server-worker communication uses the text-based protocol provided by nodejs-text-net
   - Workers register using the 'RGST' command
   - SOCKS connections are handled through sessions with the 'SOCKS' protocol
   - Session arguments include the destination host, port, and command

## Usage Instructions

### Installation

Before running the project, install the dependencies:

```bash
cd elastic-socks-proxy
npm install
```

### Running the Server

```bash
node index.js server
```

### Running a Worker

```bash
node index.js worker
```

### Testing

To test the proxy, configure a SOCKS client (like a browser or curl) to use the proxy at localhost:1080.

Example with curl:

```bash
curl --socks5 localhost:1080 https://example.com
```

## Next Steps

1. **Additional Configuration Files**
   - Create config-dev.js and config-live.js for different environments

2. **Enhanced Logging**
   - Implement more detailed logging for debugging and monitoring

3. **Authentication**
   - Add SOCKS authentication support

4. **Performance Optimization**
   - Implement connection pooling and other optimizations

5. **Metrics and Monitoring**
   - Add metrics collection for monitoring proxy performance
