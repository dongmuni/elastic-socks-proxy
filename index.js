
/**
 * elastic-socks-proxy
 * 워커 지원 분산 SOCKS 프록시
 */

'use strict';

const config = require('./config');
const textNet = require('@dongmuni/nodejs-text-net');
const socksLib = require('socks');
const util = require('@dongmuni/nodejs-util');
const net = require('net');

if (process.argv.length < 3) {
    console.log(`사용법: ${process.argv[0]} ${process.argv[1]} (server|worker)`);
    process.exit(-1);
}

var appType = process.argv[2];

if (appType === 'server') {
    startServer(config.serverOptions);
} else if (appType === 'worker') {
    startWorker(config.workerOptions);
} else {
    console.log(`알 수 없는 앱 유형: ${appType}`);
    console.log(`사용법: ${process.argv[0]} ${process.argv[1]} (server|worker)`);
    process.exit(-1);
}

/**
 * SOCKS 프록시 서버 시작
 * @param {Object} options - 서버 설정 옵션
 */
function startServer(options) {
    console.log('SOCKS 프록시 서버를 시작합니다...');
    
    const textNetOptions = options.textNetOptions || {};
    const proxyOptions = options.proxyOptions || {};
    
    const workerPool = textNet.createWorkerPool({
        autoRegister: true
    });
    
    const textNetServer = textNet.startWorkerPoolServer(textNetOptions, (client) => {
        console.log(`워커 연결됨: ${client.remoteAddress}:${client.remotePort}`);
        workerPool.addWorker(client);
        
        client.on('close', () => {
            console.log(`워커 연결 해제됨: ${client.remoteAddress}:${client.remotePort}`);
            workerPool.removeWorker(client);
        });
    });
    
    const socksServer = new socksLib.SocksServer((info, accept, deny) => {
        if (workerPool.getWorkerCount() === 0) {
            console.log('가용한 워커가 없습니다. 직접 연결을 처리합니다');
            handleSocksConnection(info, accept, deny);
        } else {
            console.log('워커에게 연결을 분배합니다');
            distributeToWorker(workerPool, info, accept, deny);
        }
    });
    
    const socksPort = proxyOptions.socksPort || 1080;
    socksServer.listen(socksPort, '0.0.0.0', () => {
        console.log(`SOCKS 프록시 서버가 포트 ${socksPort}에서 수신 중입니다`);
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
                console.error(`클라이언트 소켓 오류: ${err.message}`);
                destination.destroy();
            });
            
            destination.on('error', (err) => {
                console.error(`대상 소켓 오류: ${err.message}`);
                socket.destroy();
            });
        });
        
        destination.on('error', (err) => {
            console.error(`대상에 연결 실패: ${err.message}`);
            deny();
        });
    }
    
    function distributeToWorker(workerPool, info, accept, deny) {
        const worker = workerPool.selectWorker();
        
        if (!worker) {
            console.log('가용한 워커가 없습니다. 직접 연결을 처리합니다');
            handleSocksConnection(info, accept, deny);
            return;
        }
        
        const session = worker.createSession('SOCKS', [
            info.destination.host,
            info.destination.port.toString(),
            info.command
        ]);
        
        session.on('error', (err) => {
            console.error(`세션 오류: ${err.message}`);
            deny();
        });
        
        session.on('connect', () => {
            const socket = accept(true);
            
            socket.pipe(session);
            session.pipe(socket);
            
            socket.on('error', (err) => {
                console.error(`클라이언트 소켓 오류: ${err.message}`);
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
 * 워커 프로세스 시작
 * @param {Object} options - 워커 설정 옵션
 */
function startWorker(options) {
    console.log('SOCKS 프록시 워커를 시작합니다...');
    
    const textNetOptions = options.textNetOptions || {};
    const proxyOptions = options.proxyOptions || {};
    
    const client = textNet.autoReconnect(textNetOptions, (client) => {
        console.log(`서버에 연결됨: ${client.remoteAddress}:${client.remotePort}`);
        
        if (textNetOptions.autoRegister) {
            client.sendMessage('RGST', 0, [], null);
        }
        
        client.onSession('SOCKS', (session, args) => {
            const host = util.encoder.decodeText(args[0]);
            const port = parseInt(util.encoder.decodeText(args[1]), 10);
            const command = util.encoder.decodeText(args[2]);
            
            console.log(`${host}:${port}로의 SOCKS 연결 처리 중`);
            
            const destination = net.createConnection({
                host: host,
                port: port
            }, () => {
                console.log(`대상에 연결됨: ${host}:${port}`);
                
                session.pipe(destination);
                destination.pipe(session);
                
                destination.on('error', (err) => {
                    console.error(`대상 소켓 오류: ${err.message}`);
                    session.destroy();
                });
                
                destination.on('close', () => {
                    session.end();
                });
            });
            
            destination.on('error', (err) => {
                console.error(`대상에 연결 실패: ${err.message}`);
                session.destroy();
            });
            
            session.on('error', (err) => {
                console.error(`세션 오류: ${err.message}`);
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
