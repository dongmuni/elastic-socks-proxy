
/**
 * elastic-socks-proxy를 위한 설정 로더
 */

'use strict';

const envmap = {
    'localhost': 'local',
    '127.0.0.1': 'local'
};

const os = require('os');
const hostname = os.hostname();
const env = envmap[hostname] || 'dev';

console.log(`환경에 맞는 설정을 로드합니다: ${env}`);

try {
    module.exports = require(`./config-${env}`);
} catch (e) {
    console.error(`${env} 환경에 대한 설정 로드 실패: ${e.message}`);
    console.log('로컬 설정으로 폴백합니다');
    module.exports = require('./config-local');
}
