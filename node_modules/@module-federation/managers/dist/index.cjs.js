'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var sdk = require('@module-federation/sdk');
var finder = require('find-pkg');
var fs = require('fs');
var fs$1 = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var finder__default = /*#__PURE__*/_interopDefaultLegacy(finder);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var fs__default$1 = /*#__PURE__*/_interopDefaultLegacy(fs$1);

class BasicPluginOptionsManager {
    get enable() {
        return Boolean(this._options);
    }
    get options() {
        return this._options;
    }
    init(options, extraArgs) {
        this._options = options;
    }
    setOptions(options) {
        this._options = options;
    }
}

class PKGJsonManager {
    setPKGJson(pkg) {
        this._pkg = pkg;
    }
    readPKGJson(ctx = process.cwd()) {
        if (this._pkg) {
            return this._pkg;
        }
        try {
            // eslint-disable-next-line no-restricted-globals
            const pkg = JSON.parse(fs__default["default"].readFileSync(path__default["default"].resolve(ctx, 'package.json'), 'utf8'));
            this._pkg = pkg;
            return pkg;
        } catch (_err) {
            try {
                const pkg = finder__default["default"].sync(ctx);
                this._pkg = pkg;
                return pkg;
            } catch (err) {
                console.error(err);
                return {};
            }
        }
    }
    getExposeGarfishModuleType(ctx = process.cwd()) {
        var _pkg_mf;
        const pkg = this.readPKGJson(ctx);
        return (pkg == null ? void 0 : (_pkg_mf = pkg['mf']) == null ? void 0 : _pkg_mf.type) === sdk.MFModuleType.NPM ? sdk.MFModuleType.NPM : sdk.MFModuleType.APP;
    }
}

const LOCAL_BUILD_VERSION = 'local';

function processFn(options, normalizeSimple, normalizeOptions, fn) {
    const object = (obj)=>{
        for (const [key, value] of Object.entries(obj)){
            if (typeof value === 'string') {
                fn(key, normalizeSimple(value, key));
            } else {
                fn(key, normalizeOptions(value, key));
            }
        }
    };
    const array = (items)=>{
        for (const item of items){
            if (typeof item === 'string') {
                fn(item, normalizeSimple(item, item));
            } else if (item && typeof item === 'object') {
                object(item);
            } else {
                throw new Error('Unexpected options format');
            }
        }
    };
    if (!options) {
        return;
    } else if (Array.isArray(options)) {
        array(options);
    } else if (typeof options === 'object') {
        object(options);
    } else {
        throw new Error('Unexpected options format');
    }
}
function parseOptions(options, normalizeSimple, normalizeOptions) {
    const items = [];
    processFn(options, normalizeSimple, normalizeOptions, (key, value)=>{
        items.push([
            key,
            value
        ]);
    });
    return items;
}
function getBuildVersion() {
    if (process.env['MF_BUILD_VERSION']) {
        return process.env['MF_BUILD_VERSION'];
    }
    const pkg = new PKGJsonManager().readPKGJson();
    if ((pkg == null ? void 0 : pkg['version']) && typeof pkg['version'] === 'string') {
        return pkg['version'];
    }
    return LOCAL_BUILD_VERSION;
}
function getBuildName() {
    return process.env['MF_BUILD_NAME'];
}
// RegExp for version string
const VERSION_PATTERN_REGEXP = /^([\d^=v<>~]|[*xX]$)/;
function isRequiredVersion(str) {
    return VERSION_PATTERN_REGEXP.test(str);
}

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  parseOptions: parseOptions,
  getBuildVersion: getBuildVersion,
  getBuildName: getBuildName,
  isRequiredVersion: isRequiredVersion
});

function normalizeExposeModuleName(exposeKey) {
    const relativePath = path__default["default"].relative('.', exposeKey);
    if (!relativePath) {
        return 'ExposeEntry';
    }
    return relativePath;
}
let ContainerManager = class ContainerManager extends BasicPluginOptionsManager {
    get enable() {
        return Boolean(this.options.name && this.options.exposes && (Array.isArray(this.options.exposes) ? this.options.exposes.length > 0 : Object.keys(this.options.exposes).length > 0));
    }
    get globalEntryName() {
        const { name, library } = this.options;
        if (library) {
            if (typeof library.name === 'string') {
                return library.name;
            }
            return name;
        }
        return name;
    }
    get containerPluginExposesOptions() {
        const { exposes } = this.options;
        const parsedOptions = parseOptions(exposes, (item, key)=>({
                import: Array.isArray(item) ? item : [
                    item
                ],
                name: sdk.generateExposeFilename(key, false)
            }), (item, key)=>({
                import: Array.isArray(item.import) ? item.import : [
                    item.import
                ],
                name: item.name || sdk.generateExposeFilename(key, false)
            }));
        return parsedOptions.reduce((sum, item)=>{
            const [exposeKey, exposeObj] = item;
            sum[exposeKey] = exposeObj;
            return sum;
        }, {});
    }
    // { '.' : './src/Button.jsx' } => { '__federation_expose_Component' : ['src/Buttton'] }
    get exposeFileNameImportMap() {
        const { exposes } = this.options;
        const parsedOptions = parseOptions(exposes, (item, key)=>({
                import: Array.isArray(item) ? item : [
                    item
                ],
                name: sdk.generateExposeFilename(key, false)
            }), (item, key)=>({
                import: Array.isArray(item.import) ? item.import : [
                    item.import
                ],
                name: item.name || sdk.generateExposeFilename(key, false)
            }));
        return parsedOptions.reduce((sum, item)=>{
            const [_exposeKey, exposeObj] = item;
            const { name, import: importPath } = exposeObj;
            sum[name] = importPath;
            return sum;
        }, {});
    }
    // { '.' : './src/Button.jsx' } => { '.' : ['src/Button'] }
    get exposeObject() {
        const parsedOptions = this._parseOptions();
        return parsedOptions.reduce((sum, item)=>{
            const [exposeKey, exposeObject] = item;
            sum[exposeKey] = [];
            exposeObject.import.forEach((item)=>{
                const relativePath = path__default["default"].relative('.', item.replace(path__default["default"].extname(item), ''));
                sum[exposeKey].push(relativePath);
            });
            return sum;
        }, {});
    }
    // { '.' : './src/Button.jsx' } => ['./src/Button.jsx']
    get exposeFiles() {
        const parsedOptions = this._parseOptions();
        return parsedOptions.reduce((sum, item)=>{
            const [_exposeKey, exposeObject] = item;
            sum.push(...exposeObject.import);
            return sum;
        }, []);
    }
    get manifestModuleInfos() {
        if (this._manifestModuleInfos) {
            return this._manifestModuleInfos;
        }
        // { '.' : './src/Button.jsx' } => { '.' : {  name: 'ExposeEntry', file: './src/Button.jsx', requires: {} } }
        const parsedOptions = this._parseOptions();
        this._manifestModuleInfos = parsedOptions.reduce((sum, item)=>{
            const [exposeKey, exposeObject] = item;
            sum[exposeKey] = {
                name: exposeObject.name || normalizeExposeModuleName(exposeKey),
                file: exposeObject.import
            };
            return sum;
        }, {});
        return this._manifestModuleInfos;
    }
    // { '.' : './src/Button.jsx' } => { index: ['./src/Button.jsx'] }
    get webpackEntry() {
        return Object.values(this.manifestModuleInfos).reduce((sum, cur)=>{
            const entry = cur.name === 'ExposeEntry' ? 'index' : cur.name.slice(0, 1).toLowerCase() + cur.name.slice(1);
            sum[entry] = cur.file;
            return sum;
        }, {});
    }
    _parseOptions() {
        if (this._parsedOptions) {
            return this._parsedOptions;
        }
        this._parsedOptions = parseOptions(this.options.exposes, (item)=>({
                import: Array.isArray(item) ? item : [
                    item
                ],
                name: undefined
            }), (item)=>({
                import: Array.isArray(item.import) ? item.import : [
                    item.import
                ],
                name: undefined
            }));
        return this._parsedOptions;
    }
    init(options) {
        this.setOptions(options);
        this.validate(options.name);
    }
    validate(name) {
        if (!name) {
            throw new Error(`container name can not be empty!`);
        }
    }
};

function _extends() {
    _extends = Object.assign || function assign(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}

function getEntry(remoteObj) {
    if (typeof remoteObj === 'string') {
        return remoteObj;
    }
    if (typeof remoteObj.external === 'string') {
        return remoteObj.external;
    }
    throw new Error('Not support "array" remote value yet!');
}
let RemoteManager = class RemoteManager extends BasicPluginOptionsManager {
    get enable() {
        return Boolean(this.remotes && (Array.isArray(this.remotes) ? this.remotes.length > 0 : Object.keys(this.remotes).length > 0));
    }
    get statsRemoteWithEmptyUsedIn() {
        const { name } = this.options;
        return Object.keys(this.normalizedOptions).reduce((sum, cur)=>{
            const normalizedOption = this.normalizedOptions[cur];
            let curObj;
            if ('entry' in normalizedOption) {
                curObj = {
                    entry: normalizedOption.entry,
                    alias: normalizedOption.alias,
                    moduleName: normalizedOption.name,
                    federationContainerName: normalizedOption.name,
                    consumingFederationContainerName: name,
                    usedIn: []
                };
            } else {
                curObj = {
                    alias: normalizedOption.alias,
                    moduleName: normalizedOption.name,
                    version: normalizedOption.version,
                    federationContainerName: normalizedOption.name,
                    consumingFederationContainerName: name,
                    usedIn: []
                };
            }
            sum.push(curObj);
            return sum;
        }, []);
    }
    // 'micro-app-sub3': 'app:@garfish/micro-app-sub3:0.0.4',
    // ↓↓↓
    //  {
    //   'micro-app-sub3': @garfish/micro-app-sub3:0.0.4
    // }
    get dtsRemotes() {
        return Object.keys(this.normalizedOptions).reduce((sum, remoteAlias)=>{
            const remoteInfo = this.normalizedOptions[remoteAlias];
            sum[remoteAlias] = sdk.composeKeyWithSeparator(remoteInfo.name, 'entry' in remoteInfo ? remoteInfo.entry : remoteInfo.version);
            return sum;
        }, {});
    }
    get remotes() {
        return this.options.remotes;
    }
    // INFO: only support remoteType: script now
    normalizeOptions(options = {}) {
        this.normalizedOptions = Object.keys(options).reduce((sum, remoteAlias)=>{
            if (Array.isArray(options)) {
                return sum;
            }
            const remoteInfo = options[remoteAlias];
            if (Array.isArray(remoteInfo)) {
                return sum;
            }
            let parsedOptions;
            try {
                parsedOptions = sdk.parseEntry(typeof remoteInfo === 'string' ? remoteInfo : getEntry(remoteInfo), '', '@');
            } catch (e) {
            // noop
            }
            if (!parsedOptions) {
                return sum;
            }
            sum[remoteAlias] = _extends({}, parsedOptions, {
                alias: remoteAlias,
                shareScope: typeof remoteInfo === 'object' ? remoteInfo.shareScope || 'default' : 'default'
            });
            return sum;
        }, {});
    }
    init(options) {
        this.setOptions(options);
        this.normalizeOptions(options.remotes);
    }
    constructor(...args){
        super(...args);
        this.normalizedOptions = {};
    }
};

let SharedManager = class SharedManager extends BasicPluginOptionsManager {
    get enable() {
        return Boolean(Object.keys(this.sharedPluginOptions.shared).length);
    }
    get sharedPluginOptions() {
        const normalizedShared = this.normalizedOptions;
        const shared = Object.keys(normalizedShared).reduce((sum, cur)=>{
            const { singleton, requiredVersion, version, eager, shareScope, import: sharedImport } = normalizedShared[cur];
            sum[cur] = {
                singleton,
                requiredVersion,
                version,
                eager,
                shareScope,
                import: sharedImport
            };
            return sum;
        }, {});
        return {
            shared,
            shareScope: this.options.shareScope || 'default'
        };
    }
    findPkg(name, shareConfig) {
        try {
            let pkgPath = '';
            let depName = name;
            if (shareConfig.import) {
                if (path__default["default"].isAbsolute(shareConfig.import)) {
                    pkgPath = shareConfig.import;
                } else if (shareConfig.import.startsWith('.')) {
                    pkgPath = path__default["default"].resolve(process.cwd(), shareConfig.import);
                }
            } else {
                if (shareConfig.packageName) {
                    depName = shareConfig.packageName;
                }
            }
            pkgPath = pkgPath || require.resolve(depName, {
                paths: [
                    process.cwd()
                ]
            });
            const pkgJsonPath = finder__default["default"].sync(pkgPath);
            return {
                pkg: JSON.parse(fs__default$1["default"].readFileSync(pkgJsonPath, 'utf-8')),
                path: '',
                pkgPath: ''
            };
        } catch (err) {
            return {
                pkg: {},
                path: '',
                pkgPath: ''
            };
        }
    }
    transformSharedConfig(sharedConfig) {
        const defaultSharedConfig = {
            singleton: true,
            requiredVersion: undefined,
            shareScope: 'default'
        };
        return _extends({}, defaultSharedConfig, sharedConfig);
    }
    normalizeOptions(options) {
        const normalizedShared = {};
        const sharedOptions = parseOptions(options, (item, key)=>{
            if (typeof item !== 'string') throw new Error('Unexpected array in shared');
            const config = item === key || !isRequiredVersion(item) ? {
                import: item
            } : {
                import: key,
                requiredVersion: item
            };
            return config;
        }, (item)=>item);
        sharedOptions.forEach((item)=>{
            const [sharedName, sharedOptions] = item;
            const pkgInfo = this.findPkg(sharedName, sharedOptions);
            const sharedConfig = this.transformSharedConfig(sharedOptions[sharedName]);
            normalizedShared[sharedName] = _extends({}, sharedConfig, {
                requiredVersion: typeof sharedConfig.requiredVersion !== 'undefined' ? sharedConfig.requiredVersion : `^${pkgInfo.pkg['version']}`,
                name: sharedName,
                version: pkgInfo.pkg['version'],
                eager: Boolean(sharedConfig.eager)
            });
        });
        this.normalizedOptions = normalizedShared;
    }
    init(options) {
        this.setOptions(options);
        this.normalizeOptions(options.shared);
    }
    constructor(...args){
        super(...args);
        this.normalizedOptions = {};
    }
};

var types = /*#__PURE__*/Object.freeze({
  __proto__: null
});

exports.BasicPluginOptionsManager = BasicPluginOptionsManager;
exports.ContainerManager = ContainerManager;
exports.PKGJsonManager = PKGJsonManager;
exports.RemoteManager = RemoteManager;
exports.SharedManager = SharedManager;
exports.types = types;
exports.utils = utils;
