
/**
 * elastic-socks-proxy를 위한 로컬 개발 환경 설정
 */

'use strict';

module.exports = {
    serverOptions: {
        textNetOptions: {
            port: 8081,
            host: '0.0.0.0',
            backlog: 1024,
            logConnection: true,
            logSession: false,
            idleCloseTimeout: 60000
        },
        proxyOptions: {
            socksPort: 1080,
            logEvent: false,
            logError: false,
            logAccess: true
        }
    },
    
    workerOptions: {
        textNetOptions: {
            host: 'localhost',
            port: 8081,
            autoRegister: true,
            idlePingTimeout: 30000,
            reconnectInterval: 3000,
            logConnection: true,
            logSession: false
        },
        proxyOptions: {
            logEvent: false,
            logError: false,
            logAccess: true
        }
    }
};
