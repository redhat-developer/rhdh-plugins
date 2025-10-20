'use strict';

var globalAxios = require('axios');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var globalAxios__default = /*#__PURE__*/_interopDefaultCompat(globalAxios);

const BASE_PATH = "http://localhost".replace(/\/+$/, "");
class BaseAPI {
  constructor(configuration, basePath = BASE_PATH, axios = globalAxios__default.default) {
    this.basePath = basePath;
    this.axios = axios;
    if (configuration) {
      this.configuration = configuration;
      this.basePath = configuration.basePath ?? basePath;
    }
  }
  configuration;
}
class RequiredError extends Error {
  constructor(field, msg) {
    super(msg);
    this.field = field;
    this.name = "RequiredError";
  }
}
const operationServerMap = {};

exports.BASE_PATH = BASE_PATH;
exports.BaseAPI = BaseAPI;
exports.RequiredError = RequiredError;
exports.operationServerMap = operationServerMap;
//# sourceMappingURL=base.cjs.js.map
