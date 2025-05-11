
/**
 * Configuration loader for elastic-socks-proxy
 */

'use strict';

const envmap = {
    'localhost': 'local',
    '127.0.0.1': 'local'
};

const os = require('os');
const hostname = os.hostname();
const env = envmap[hostname] || 'dev';

console.log(`Loading configuration for environment: ${env}`);

try {
    module.exports = require(`./config-${env}`);
} catch (e) {
    console.error(`Failed to load configuration for environment ${env}: ${e.message}`);
    console.log('Falling back to local configuration');
    module.exports = require('./config-local');
}
