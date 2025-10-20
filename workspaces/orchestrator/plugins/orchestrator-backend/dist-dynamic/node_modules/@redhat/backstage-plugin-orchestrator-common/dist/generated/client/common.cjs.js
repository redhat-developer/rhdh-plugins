'use strict';

var base = require('./base.cjs.js');

const DUMMY_BASE_URL = "https://example.com";
const assertParamExists = function(functionName, paramName, paramValue) {
  if (paramValue === null || paramValue === void 0) {
    throw new base.RequiredError(paramName, `Required parameter ${paramName} was null or undefined when calling ${functionName}.`);
  }
};
function setFlattenedQueryParams(urlSearchParams, parameter, key = "") {
  if (parameter == null) return;
  if (typeof parameter === "object") {
    if (Array.isArray(parameter)) {
      parameter.forEach((item) => setFlattenedQueryParams(urlSearchParams, item, key));
    } else {
      Object.keys(parameter).forEach(
        (currentKey) => setFlattenedQueryParams(urlSearchParams, parameter[currentKey], `${key}${key !== "" ? "." : ""}${currentKey}`)
      );
    }
  } else {
    if (urlSearchParams.has(key)) {
      urlSearchParams.append(key, parameter);
    } else {
      urlSearchParams.set(key, parameter);
    }
  }
}
const setSearchParams = function(url, ...objects) {
  const searchParams = new URLSearchParams(url.search);
  setFlattenedQueryParams(searchParams, objects);
  url.search = searchParams.toString();
};
const serializeDataIfNeeded = function(value, requestOptions, configuration) {
  const nonString = typeof value !== "string";
  const needsSerialization = nonString && configuration && configuration.isJsonMime ? configuration.isJsonMime(requestOptions.headers["Content-Type"]) : nonString;
  return needsSerialization ? JSON.stringify(value !== void 0 ? value : {}) : value || "";
};
const toPathString = function(url) {
  return url.pathname + url.search + url.hash;
};
const createRequestFunction = function(axiosArgs, globalAxios, BASE_PATH, configuration) {
  return (axios = globalAxios, basePath = BASE_PATH) => {
    const axiosRequestArgs = { ...axiosArgs.options, url: (axios.defaults.baseURL ? "" : configuration?.basePath ?? basePath) + axiosArgs.url };
    return axios.request(axiosRequestArgs);
  };
};

exports.DUMMY_BASE_URL = DUMMY_BASE_URL;
exports.assertParamExists = assertParamExists;
exports.createRequestFunction = createRequestFunction;
exports.serializeDataIfNeeded = serializeDataIfNeeded;
exports.setSearchParams = setSearchParams;
exports.toPathString = toPathString;
//# sourceMappingURL=common.cjs.js.map
