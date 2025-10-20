"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIntegration = getSocketIntegration;
function getSocketIntegration(integrationType) {
    let resolvedSocketIntegration;
    switch (integrationType) {
        case 'wds': {
            resolvedSocketIntegration = require.resolve('../sockets/WDSSocket');
            break;
        }
        case 'whm': {
            resolvedSocketIntegration = require.resolve('../sockets/WHMEventSource');
            break;
        }
        default: {
            resolvedSocketIntegration = require.resolve(integrationType);
            break;
        }
    }
    return resolvedSocketIntegration;
}
