'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

function getWebpackPath(compiler, options = {
    framework: 'other'
}) {
    try {
        // @ts-ignore just throw err
        compiler.webpack();
        return '';
    } catch (err) {
        var _err_stack;
        const trace = ((_err_stack = err.stack) == null ? void 0 : _err_stack.split('\n')) || [];
        const webpackErrLocation = trace.find((item)=>item.includes('at webpack')) || '';
        const webpackLocationWithDetail = webpackErrLocation.replace(/[^\(\)]+/, '').slice(1, -1);
        const webpackPath = webpackLocationWithDetail.split(':').slice(0, -2).join(':');
        if ((options == null ? void 0 : options.framework) === 'nextjs') {
            if (webpackPath.endsWith('webpack.js')) {
                return webpackPath.replace('webpack.js', 'index.js');
            }
            return '';
        }
        return require.resolve('webpack', {
            paths: [
                webpackPath
            ]
        });
    }
}
const normalizeWebpackPath = (fullPath)=>{
    if (fullPath === 'webpack') {
        return process.env['FEDERATION_WEBPACK_PATH'] || fullPath;
    }
    if (process.env['FEDERATION_WEBPACK_PATH']) {
        return path__default["default"].resolve(process.env['FEDERATION_WEBPACK_PATH'], fullPath.replace('webpack', '../../'));
    }
    return fullPath;
};

exports.getWebpackPath = getWebpackPath;
exports.normalizeWebpackPath = normalizeWebpackPath;
