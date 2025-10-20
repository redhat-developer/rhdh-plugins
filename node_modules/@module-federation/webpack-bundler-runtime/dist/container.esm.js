import federation from './index.esm.js';
import '@module-federation/runtime';
import './constant.esm.js';
import '@module-federation/sdk';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var _this = undefined;
var createContainer = function(federationOptions) {
    var exposes = federationOptions.exposes, name = federationOptions.name, _federationOptions_remotes = federationOptions.remotes, remotes = _federationOptions_remotes === void 0 ? [] : _federationOptions_remotes, shared = federationOptions.shared, plugins = federationOptions.plugins;
    var __webpack_modules__ = {
        './node_modules/.federation/entry.1f2288102e035e2ed66b2efaf60ad043.js': function(//@ts-ignore
        module, //@ts-ignore
        __webpack_exports__, //@ts-ignore
        __webpack_require__) {
            __webpack_require__.r(__webpack_exports__);
            var bundler_runtime = __webpack_require__.n(federation);
            var prevFederation = __webpack_require__.federation;
            __webpack_require__.federation = {};
            for(var key in bundler_runtime()){
                __webpack_require__.federation[key] = bundler_runtime()[key];
            }
            for(var key1 in prevFederation){
                __webpack_require__.federation[key1] = prevFederation[key1];
            }
            if (!__webpack_require__.federation.instance) {
                var pluginsToAdd = plugins || [];
                __webpack_require__.federation.initOptions.plugins = __webpack_require__.federation.initOptions.plugins ? __webpack_require__.federation.initOptions.plugins.concat(pluginsToAdd) : pluginsToAdd;
                __webpack_require__.federation.instance = __webpack_require__.federation.runtime.init(__webpack_require__.federation.initOptions);
                if (__webpack_require__.federation.attachShareScopeMap) {
                    __webpack_require__.federation.attachShareScopeMap(__webpack_require__);
                }
                if (__webpack_require__.federation.installInitialConsumes) {
                    __webpack_require__.federation.installInitialConsumes();
                }
            }
        },
        //@ts-ignore
        'webpack/container/entry/createContainer': function(//@ts-ignore
        module, //@ts-ignore
        exports, //@ts-ignore
        __webpack_require__) {
            var _loop = function(key) {
                if (Object.prototype.hasOwnProperty.call(exposes, key)) {
                    //@ts-ignore
                    moduleMap[key] = function() {
                        return Promise.resolve(exposes[key]()).then(function(m) {
                            return function() {
                                return m;
                            };
                        });
                    };
                }
            };
            var moduleMap = {};
            for(var key in exposes)_loop(key);
            //@ts-ignore
            var get = function(module, getScope) {
                __webpack_require__.R = getScope;
                getScope = __webpack_require__.o(moduleMap, module) ? moduleMap[module]() : Promise.resolve().then(function() {
                    throw new Error('Module "'.concat(module, '" does not exist in container.'));
                });
                __webpack_require__.R = undefined;
                return getScope;
            };
            //@ts-ignore
            var init = function(shareScope, initScope, remoteEntryInitOptions) {
                return __webpack_require__.federation.bundlerRuntime.initContainerEntry({
                    webpackRequire: __webpack_require__,
                    shareScope: shareScope,
                    initScope: initScope,
                    remoteEntryInitOptions: remoteEntryInitOptions,
                    shareScopeKey: 'default'
                });
            };
            __webpack_require__('./node_modules/.federation/entry.1f2288102e035e2ed66b2efaf60ad043.js');
            // This exports getters to disallow modifications
            __webpack_require__.d(exports, {
                get: function() {
                    return get;
                },
                init: function() {
                    return init;
                },
                moduleMap: function() {
                    return moduleMap;
                }
            });
        }
    };
    var __webpack_module_cache__ = {};
    //@ts-ignore
    var __webpack_require__ = function(moduleId) {
        //@ts-ignore
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== undefined) {
            return cachedModule.exports;
        }
        //@ts-ignore
        var module = __webpack_module_cache__[moduleId] = {
            id: moduleId,
            loaded: false,
            exports: {}
        };
        var execOptions = {
            id: moduleId,
            module: module,
            //@ts-ignore
            factory: __webpack_modules__[moduleId],
            require: __webpack_require__
        };
        __webpack_require__.i.forEach(function(handler) {
            handler(execOptions);
        });
        module = execOptions.module;
        execOptions.factory.call(module.exports, module, module.exports, execOptions.require);
        module.loaded = true;
        return module.exports;
    };
    __webpack_require__.m = __webpack_modules__;
    __webpack_require__.c = __webpack_module_cache__;
    //@ts-ignore
    __webpack_require__.i = [];
    //@ts-ignore
    if (!__webpack_require__.federation) {
        __webpack_require__.federation = {
            initOptions: {
                name: name,
                //@ts-ignore
                remotes: remotes.map(function(remote) {
                    return {
                        type: remote.type,
                        alias: remote.alias,
                        name: remote.name,
                        //@ts-ignore
                        entry: remote.entry,
                        shareScope: remote.shareScope || 'default'
                    };
                })
            },
            chunkMatcher: function() {
                return true;
            },
            rootOutputDir: '',
            initialConsumes: undefined,
            bundlerRuntimeOptions: {}
        };
    }
    //@ts-ignore
    __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ? function() {
            return module['default'];
        } : function() {
            return module;
        };
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
    //@ts-ignore
    __webpack_require__.d = function(exports, definition) {
        for(var key in definition){
            if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                Object.defineProperty(exports, key, {
                    enumerable: true,
                    get: definition[key]
                });
            }
        }
    };
    __webpack_require__.f = {};
    __webpack_require__.g = function() {
        if ((typeof globalThis === "undefined" ? "undefined" : _type_of(globalThis)) === 'object') return globalThis;
        try {
            return _this || new Function('return this')();
        } catch (e) {
            if ((typeof window === "undefined" ? "undefined" : _type_of(window)) === 'object') return window;
        }
    }();
    //@ts-ignore
    __webpack_require__.o = function(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    };
    //@ts-ignore
    __webpack_require__.r = function(exports) {
        if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
            Object.defineProperty(exports, Symbol.toStringTag, {
                value: 'Module'
            });
        }
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
    };
    //@ts-ignore
    __webpack_require__.federation.initOptions.shared = shared;
    __webpack_require__.S = {};
    var initPromises = {};
    var initTokens = {};
    //@ts-ignore
    __webpack_require__.I = function(name, initScope) {
        //@ts-ignore
        return __webpack_require__.federation.bundlerRuntime.I({
            shareScopeName: name,
            webpackRequire: __webpack_require__,
            initPromises: initPromises,
            initTokens: initTokens,
            initScope: initScope
        });
    };
    var __webpack_exports__ = __webpack_require__('webpack/container/entry/createContainer');
    __webpack_exports__.get;
    __webpack_exports__.init;
    return __webpack_exports__;
};
var createContainerAsync = function() {
    var _ref = _async_to_generator(function(federationOptions) {
        return _ts_generator(this, function(_state) {
            // todo: consider async startup options here, for "async boundary" provision.
            return [
                2,
                createContainer(federationOptions)
            ];
        });
    });
    return function createContainerAsync(federationOptions) {
        return _ref.apply(this, arguments);
    };
}();

export { createContainer, createContainerAsync };
