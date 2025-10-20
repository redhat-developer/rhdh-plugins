'use strict';

var runtimeCore = require('@module-federation/runtime-core');
var errorCodes = require('@module-federation/error-codes');
var utils = require('./utils.cjs.cjs');

function createInstance(options) {
    // Retrieve debug constructor
    const ModuleFederationConstructor = runtimeCore.getGlobalFederationConstructor() || runtimeCore.ModuleFederation;
    return new ModuleFederationConstructor(options);
}
let FederationInstance = null;
/**
 * @deprecated Use createInstance or getInstance instead
 */ function init(options) {
    // Retrieve the same instance with the same name
    const instance = utils.getGlobalFederationInstance(options.name, options.version);
    if (!instance) {
        FederationInstance = createInstance(options);
        runtimeCore.setGlobalFederationInstance(FederationInstance);
        return FederationInstance;
    } else {
        // Merge options
        instance.initOptions(options);
        if (!FederationInstance) {
            FederationInstance = instance;
        }
        return instance;
    }
}
function loadRemote(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    const loadRemote1 = FederationInstance.loadRemote;
    // eslint-disable-next-line prefer-spread
    return loadRemote1.apply(FederationInstance, args);
}
function loadShare(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    const loadShare1 = FederationInstance.loadShare;
    return loadShare1.apply(FederationInstance, args);
}
function loadShareSync(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    const loadShareSync1 = FederationInstance.loadShareSync;
    // eslint-disable-next-line prefer-spread
    return loadShareSync1.apply(FederationInstance, args);
}
function preloadRemote(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.preloadRemote.apply(FederationInstance, args);
}
function registerRemotes(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerRemotes.apply(FederationInstance, args);
}
function registerPlugins(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerPlugins.apply(FederationInstance, args);
}
function getInstance() {
    return FederationInstance;
}
function registerShared(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerShared.apply(FederationInstance, args);
}
// Inject for debug
runtimeCore.setGlobalFederationConstructor(runtimeCore.ModuleFederation);

exports.Module = runtimeCore.Module;
exports.ModuleFederation = runtimeCore.ModuleFederation;
exports.getRemoteEntry = runtimeCore.getRemoteEntry;
exports.getRemoteInfo = runtimeCore.getRemoteInfo;
exports.loadScript = runtimeCore.loadScript;
exports.loadScriptNode = runtimeCore.loadScriptNode;
exports.registerGlobalPlugins = runtimeCore.registerGlobalPlugins;
exports.createInstance = createInstance;
exports.getInstance = getInstance;
exports.init = init;
exports.loadRemote = loadRemote;
exports.loadShare = loadShare;
exports.loadShareSync = loadShareSync;
exports.preloadRemote = preloadRemote;
exports.registerPlugins = registerPlugins;
exports.registerRemotes = registerRemotes;
exports.registerShared = registerShared;
