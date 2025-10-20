"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntegrationEntry = getIntegrationEntry;
/**
 * Gets entry point of a supported socket integration.
 * @param integrationType A valid socket integration type or a path to a module.
 * @returns Path to the resolved integration entry point.
 */
function getIntegrationEntry(integrationType) {
    let resolvedEntry;
    switch (integrationType) {
        case 'whm': {
            resolvedEntry = 'webpack-hot-middleware/client';
            break;
        }
    }
    return resolvedEntry;
}
