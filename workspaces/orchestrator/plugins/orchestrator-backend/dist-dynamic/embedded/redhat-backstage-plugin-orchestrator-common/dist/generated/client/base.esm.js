import globalAxios from 'axios';

const BASE_PATH = "http://localhost".replace(/\/+$/, "");
class BaseAPI {
  constructor(configuration, basePath = BASE_PATH, axios = globalAxios) {
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

export { BASE_PATH, BaseAPI, RequiredError, operationServerMap };
//# sourceMappingURL=base.esm.js.map
