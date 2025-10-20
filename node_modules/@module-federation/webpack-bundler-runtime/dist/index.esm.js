import * as runtime from '@module-federation/runtime';
import { FEDERATION_SUPPORTED_TYPES } from './constant.esm.js';
import { decodeName, ENCODE_NAME_PREFIX } from '@module-federation/sdk';

function attachShareScopeMap(webpackRequire) {
    if (!webpackRequire.S || webpackRequire.federation.hasAttachShareScopeMap || !webpackRequire.federation.instance || !webpackRequire.federation.instance.shareScopeMap) {
        return;
    }
    webpackRequire.S = webpackRequire.federation.instance.shareScopeMap;
    webpackRequire.federation.hasAttachShareScopeMap = true;
}

function remotes(options) {
    var chunkId = options.chunkId, promises = options.promises, chunkMapping = options.chunkMapping, idToExternalAndNameMapping = options.idToExternalAndNameMapping, webpackRequire = options.webpackRequire, idToRemoteMap = options.idToRemoteMap;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach(function(id) {
            var getScope = webpackRequire.R;
            if (!getScope) {
                getScope = [];
            }
            var data = idToExternalAndNameMapping[id];
            var remoteInfos = idToRemoteMap[id];
            // @ts-ignore seems not work
            if (getScope.indexOf(data) >= 0) {
                return;
            }
            // @ts-ignore seems not work
            getScope.push(data);
            if (data.p) {
                return promises.push(data.p);
            }
            var onError = function(error) {
                if (!error) {
                    error = new Error('Container missing');
                }
                if (typeof error.message === 'string') {
                    error.message += '\nwhile loading "'.concat(data[1], '" from ').concat(data[2]);
                }
                webpackRequire.m[id] = function() {
                    throw error;
                };
                data.p = 0;
            };
            var handleFunction = function(fn, arg1, arg2, d, next, first) {
                try {
                    var promise = fn(arg1, arg2);
                    if (promise && promise.then) {
                        var p = promise.then(function(result) {
                            return next(result, d);
                        }, onError);
                        if (first) {
                            promises.push(data.p = p);
                        } else {
                            return p;
                        }
                    } else {
                        return next(promise, d, first);
                    }
                } catch (error) {
                    onError(error);
                }
            };
            var onExternal = function(external, _, first) {
                return external ? handleFunction(webpackRequire.I, data[0], 0, external, onInitialized, first) : onError();
            };
            // eslint-disable-next-line no-var
            var onInitialized = function(_, external, first) {
                return handleFunction(external.get, data[1], getScope, 0, onFactory, first);
            };
            // eslint-disable-next-line no-var
            var onFactory = function(factory) {
                data.p = 1;
                webpackRequire.m[id] = function(module) {
                    module.exports = factory();
                };
            };
            var onRemoteLoaded = function() {
                try {
                    var remoteName = decodeName(remoteInfos[0].name, ENCODE_NAME_PREFIX);
                    var remoteModuleName = remoteName + data[1].slice(1);
                    return webpackRequire.federation.instance.loadRemote(remoteModuleName, {
                        loadFactory: false,
                        from: 'build'
                    });
                } catch (error) {
                    onError(error);
                }
            };
            var useRuntimeLoad = remoteInfos.length === 1 && FEDERATION_SUPPORTED_TYPES.includes(remoteInfos[0].externalType) && remoteInfos[0].name;
            if (useRuntimeLoad) {
                handleFunction(onRemoteLoaded, data[2], 0, 0, onFactory, 1);
            } else {
                handleFunction(webpackRequire, data[2], 0, 0, onExternal, 1);
            }
        });
    }
}

function consumes(options) {
    var chunkId = options.chunkId, promises = options.promises, chunkMapping = options.chunkMapping, installedModules = options.installedModules, moduleToHandlerMapping = options.moduleToHandlerMapping, webpackRequire = options.webpackRequire;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach(function(id) {
            if (webpackRequire.o(installedModules, id)) {
                return promises.push(installedModules[id]);
            }
            var onFactory = function(factory) {
                installedModules[id] = 0;
                webpackRequire.m[id] = function(module) {
                    delete webpackRequire.c[id];
                    module.exports = factory();
                };
            };
            var onError = function(error) {
                delete installedModules[id];
                webpackRequire.m[id] = function(module) {
                    delete webpackRequire.c[id];
                    throw error;
                };
            };
            try {
                var federationInstance = webpackRequire.federation.instance;
                if (!federationInstance) {
                    throw new Error('Federation instance not found!');
                }
                var _moduleToHandlerMapping_id = moduleToHandlerMapping[id], shareKey = _moduleToHandlerMapping_id.shareKey, getter = _moduleToHandlerMapping_id.getter, shareInfo = _moduleToHandlerMapping_id.shareInfo;
                var promise = federationInstance.loadShare(shareKey, {
                    customShareInfo: shareInfo
                }).then(function(factory) {
                    if (factory === false) {
                        return getter();
                    }
                    return factory;
                });
                if (promise.then) {
                    promises.push(installedModules[id] = promise.then(onFactory).catch(onError));
                } else {
                    // @ts-ignore maintain previous logic
                    onFactory(promise);
                }
            } catch (e) {
                onError(e);
            }
        });
    }
}

function initializeSharing(param) {
    var shareScopeName = param.shareScopeName, webpackRequire = param.webpackRequire, initPromises = param.initPromises, initTokens = param.initTokens, initScope = param.initScope;
    if (!initScope) initScope = [];
    var mfInstance = webpackRequire.federation.instance;
    // handling circular init calls
    var initToken = initTokens[shareScopeName];
    if (!initToken) initToken = initTokens[shareScopeName] = {
        from: mfInstance.name
    };
    if (initScope.indexOf(initToken) >= 0) return;
    initScope.push(initToken);
    var promise = initPromises[shareScopeName];
    if (promise) return promise;
    var warn = function(msg) {
        return typeof console !== 'undefined' && console.warn && console.warn(msg);
    };
    var initExternal = function(id) {
        var handleError = function(err) {
            return warn('Initialization of sharing external failed: ' + err);
        };
        try {
            var module = webpackRequire(id);
            if (!module) return;
            var initFn = function(module) {
                return module && module.init && // @ts-ignore compat legacy mf shared behavior
                module.init(webpackRequire.S[shareScopeName], initScope);
            };
            if (module.then) return promises.push(module.then(initFn, handleError));
            var initResult = initFn(module);
            // @ts-ignore
            if (initResult && typeof initResult !== 'boolean' && initResult.then) // @ts-ignore
            return promises.push(initResult['catch'](handleError));
        } catch (err) {
            handleError(err);
        }
    };
    var promises = mfInstance.initializeSharing(shareScopeName, {
        strategy: mfInstance.options.shareStrategy,
        initScope: initScope,
        from: 'build'
    });
    attachShareScopeMap(webpackRequire);
    var bundlerRuntimeRemotesOptions = webpackRequire.federation.bundlerRuntimeOptions.remotes;
    if (bundlerRuntimeRemotesOptions) {
        Object.keys(bundlerRuntimeRemotesOptions.idToRemoteMap).forEach(function(moduleId) {
            var info = bundlerRuntimeRemotesOptions.idToRemoteMap[moduleId];
            var externalModuleId = bundlerRuntimeRemotesOptions.idToExternalAndNameMapping[moduleId][2];
            if (info.length > 1) {
                initExternal(externalModuleId);
            } else if (info.length === 1) {
                var remoteInfo = info[0];
                if (!FEDERATION_SUPPORTED_TYPES.includes(remoteInfo.externalType)) {
                    initExternal(externalModuleId);
                }
            }
        });
    }
    if (!promises.length) {
        return initPromises[shareScopeName] = true;
    }
    return initPromises[shareScopeName] = Promise.all(promises).then(function() {
        return initPromises[shareScopeName] = true;
    });
}

function handleInitialConsumes(options) {
    var moduleId = options.moduleId, moduleToHandlerMapping = options.moduleToHandlerMapping, webpackRequire = options.webpackRequire;
    var federationInstance = webpackRequire.federation.instance;
    if (!federationInstance) {
        throw new Error('Federation instance not found!');
    }
    var _moduleToHandlerMapping_moduleId = moduleToHandlerMapping[moduleId], shareKey = _moduleToHandlerMapping_moduleId.shareKey, shareInfo = _moduleToHandlerMapping_moduleId.shareInfo;
    try {
        return federationInstance.loadShareSync(shareKey, {
            customShareInfo: shareInfo
        });
    } catch (err) {
        console.error('loadShareSync failed! The function should not be called unless you set "eager:true". If you do not set it, and encounter this issue, you can check whether an async boundary is implemented.');
        console.error('The original error message is as follows: ');
        throw err;
    }
}
function installInitialConsumes(options) {
    var moduleToHandlerMapping = options.moduleToHandlerMapping, webpackRequire = options.webpackRequire, installedModules = options.installedModules, initialConsumes = options.initialConsumes;
    initialConsumes.forEach(function(id) {
        webpackRequire.m[id] = function(module) {
            // Handle scenario when module is used synchronously
            installedModules[id] = 0;
            delete webpackRequire.c[id];
            var factory = handleInitialConsumes({
                moduleId: id,
                moduleToHandlerMapping: moduleToHandlerMapping,
                webpackRequire: webpackRequire
            });
            if (typeof factory !== 'function') {
                throw new Error("Shared module is not available for eager consumption: ".concat(id));
            }
            module.exports = factory();
        };
    });
}

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function initContainerEntry(options) {
    var webpackRequire = options.webpackRequire, shareScope = options.shareScope, initScope = options.initScope, shareScopeKey = options.shareScopeKey, remoteEntryInitOptions = options.remoteEntryInitOptions;
    if (!webpackRequire.S) return;
    if (!webpackRequire.federation || !webpackRequire.federation.instance || !webpackRequire.federation.initOptions) return;
    var federationInstance = webpackRequire.federation.instance;
    var name = shareScopeKey || 'default';
    federationInstance.initOptions(_object_spread({
        name: webpackRequire.federation.initOptions.name,
        remotes: []
    }, remoteEntryInitOptions));
    federationInstance.initShareScopeMap(name, shareScope, {
        hostShareScopeMap: (remoteEntryInitOptions === null || remoteEntryInitOptions === void 0 ? void 0 : remoteEntryInitOptions.shareScopeMap) || {}
    });
    if (webpackRequire.federation.attachShareScopeMap) {
        webpackRequire.federation.attachShareScopeMap(webpackRequire);
    }
    if (typeof webpackRequire.federation.prefetch === 'function') {
        webpackRequire.federation.prefetch();
    }
    // @ts-ignore
    return webpackRequire.I(name, initScope);
}

var federation = {
    runtime: runtime,
    instance: undefined,
    initOptions: undefined,
    bundlerRuntime: {
        remotes: remotes,
        consumes: consumes,
        I: initializeSharing,
        S: {},
        installInitialConsumes: installInitialConsumes,
        initContainerEntry: initContainerEntry
    },
    attachShareScopeMap: attachShareScopeMap,
    bundlerRuntimeOptions: {}
};

export { federation as default };
