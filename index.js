
/**
 * elastic-socks-proxy
 * A distributed SOCKS proxy with worker support
 */

'use strict';

const config = require('./config');
const textNet = require('@dongmuni/nodejs-text-net');
const socksLib = require('socks');
const util = require('@dongmuni/nodejs-util');
const net = require('net');

if (process.argv.length < 3) {
    console.log(`USAGE: ${process.argv[0]} ${process.argv[1]} (server|worker)`);
    process.exit(-1);
}

var appType = process.argv[2];

if (appType === 'server') {
    startServer(config.serverOptions);
} else if (appType === 'worker') {
    startWorker(config.workerOptions);
} else {
    console.log(`Unknown app type: ${appType}`);
    console.log(`USAGE: ${process.argv[0]} ${process.argv[1]} (server|worker)`);
    process.exit(-1);
}

/**
 * Start the SOCKS proxy server
 * @param {Object} options - Server configuration options
 */
function startServer(options) {
    console.log('Starting SOCKS proxy server...');
    
    const textNetOptions = options.textNetOptions || {};
    const proxyOptions = options.proxyOptions || {};
    
    const workerPool = textNet.createWorkerPool({
        autoRegister: true
    });
    
    const textNetServer = textNet.startWorkerPoolServer(textNetOptions, (client) => {
        console.log(`Worker connected: ${client.remoteAddress}:${client.remotePort}`);
        workerPool.addWorker(client);
        
        client.on('close', () => {
            console.log(`Worker disconnected: ${client.remoteAddress}:${client.remotePort}`);
            workerPool.removeWorker(client);
        });
    });
    
    const socksServer = new socksLib.SocksServer((info, accept, deny) => {
        if (workerPool.getWorkerCount() === 0) {
            console.log('No workers available, handling connection directly');
            handleSocksConnection(info, accept, deny);
        } else {
            console.log('Distributing connection to worker');
            distributeToWorker(workerPool, info, accept, deny);
        }
    });
    
    const socksPort = proxyOptions.socksPort || 1080;
    socksServer.listen(socksPort, '0.0.0.0', () => {
        console.log(`SOCKS proxy server listening on port ${socksPort}`);
    });
    
    function handleSocksConnection(info, accept, deny) {
        const { host, port } = info.destination;
        
        const destination = net.createConnection({
            host: host,
            port: port
        }, () => {
            const socket = accept(true);
            
            socket.pipe(destination);
            destination.pipe(socket);
            
            socket.on('error', (err) => {
                console.error(`Client socket error: ${err.message}`);
                destination.destroy();
            });
            
            destination.on('error', (err) => {
                console.error(`Destination socket error: ${err.message}`);
                socket.destroy();
            });
        });
        
        destination.on('error', (err) => {
            console.error(`Failed to connect to destination: ${err.message}`);
            deny();
        });
    }
    
    function distributeToWorker(workerPool, info, accept, deny) {
        const worker = workerPool.selectWorker();
        
        if (!worker) {
            console.log('No worker available, handling connection directly');
            handleSocksConnection(info, accept, deny);
            return;
        }
        
        const session = worker.createSession('SOCKS', [
            info.destination.host,
            info.destination.port.toString(),
            info.command
        ]);
        
        session.on('error', (err) => {
            console.error(`Session error: ${err.message}`);
            deny();
        });
        
        session.on('connect', () => {
            const socket = accept(true);
            
            socket.pipe(session);
            session.pipe(socket);
            
            socket.on('error', (err) => {
                console.error(`Client socket error: ${err.message}`);
                session.destroy();
            });
            
            socket.on('close', () => {
                session.end();
            });
            
            session.on('close', () => {
                socket.destroy();
            });
        });
    }
}

/**
 * Start a worker process
 * @param {Object} options - Worker configuration options
 */
function startWorker(options) {
    console.log('Starting SOCKS proxy worker...');
    
    const textNetOptions = options.textNetOptions || {};
    const proxyOptions = options.proxyOptions || {};
    
    const client = textNet.autoReconnect(textNetOptions, (client) => {
        console.log(`Connected to server: ${client.remoteAddress}:${client.remotePort}`);
        
        if (textNetOptions.autoRegister) {
            client.sendMessage('RGST', 0, [], null);
        }
        
        client.onSession('SOCKS', (session, args) => {
            const host = util.encoder.decodeText(args[0]);
            const port = parseInt(util.encoder.decodeText(args[1]), 10);
            const command = util.encoder.decodeText(args[2]);
            
            console.log(`Handling SOCKS connection to ${host}:${port}`);
            
            const destination = net.createConnection({
                host: host,
                port: port
            }, () => {
                console.log(`Connected to destination: ${host}:${port}`);
                
                session.pipe(destination);
                destination.pipe(session);
                
                destination.on('error', (err) => {
                    console.error(`Destination socket error: ${err.message}`);
                    session.destroy();
                });
                
                destination.on('close', () => {
                    session.end();
                });
            });
            
            destination.on('error', (err) => {
                console.error(`Failed to connect to destination: ${err.message}`);
                session.destroy();
            });
            
            session.on('error', (err) => {
                console.error(`Session error: ${err.message}`);
                if (destination) {
                    destination.destroy();
                }
            });
            
            session.on('close', () => {
                if (destination) {
                    destination.destroy();
                }
            });
        });
    });
}
