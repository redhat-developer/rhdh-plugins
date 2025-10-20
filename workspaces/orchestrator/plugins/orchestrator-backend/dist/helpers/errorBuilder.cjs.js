'use strict';

const NO_DATA_INDEX_URL = "NO_DATA_INDEX_URL";
const NO_CLIENT_PROVIDED = "NO_CLIENT_PROVIDED";
const SWF_BACKEND_NOT_INITED = "SWF_BACKEND_NOT_INITED";
class ErrorBuilder {
  static NewBackendError(name, message) {
    const e = new Error(message);
    e.name = name;
    return e;
  }
  static GET_NO_DATA_INDEX_URL_ERR() {
    return this.NewBackendError(
      NO_DATA_INDEX_URL,
      "No data index url specified or found"
    );
  }
  static GET_NO_CLIENT_PROVIDED_ERR() {
    return this.NewBackendError(
      NO_CLIENT_PROVIDED,
      "No or null graphql client"
    );
  }
  static GET_SWF_BACKEND_NOT_INITED() {
    return this.NewBackendError(
      SWF_BACKEND_NOT_INITED,
      "The SonataFlow backend is not initialized, call initialize() method before trying to get the workflows."
    );
  }
}

exports.ErrorBuilder = ErrorBuilder;
exports.NO_CLIENT_PROVIDED = NO_CLIENT_PROVIDED;
exports.NO_DATA_INDEX_URL = NO_DATA_INDEX_URL;
exports.SWF_BACKEND_NOT_INITED = SWF_BACKEND_NOT_INITED;
//# sourceMappingURL=errorBuilder.cjs.js.map
