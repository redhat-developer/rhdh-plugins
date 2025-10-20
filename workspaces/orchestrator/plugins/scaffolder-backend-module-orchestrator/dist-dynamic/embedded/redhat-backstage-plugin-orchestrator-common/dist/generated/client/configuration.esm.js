class Configuration {
  /**
   * parameter for apiKey security
   * @param name security name
   * @memberof Configuration
   */
  apiKey;
  /**
   * parameter for basic security
   *
   * @type {string}
   * @memberof Configuration
   */
  username;
  /**
   * parameter for basic security
   *
   * @type {string}
   * @memberof Configuration
   */
  password;
  /**
   * parameter for oauth2 security
   * @param name security name
   * @param scopes oauth2 scope
   * @memberof Configuration
   */
  accessToken;
  /**
   * override base path
   *
   * @type {string}
   * @memberof Configuration
   */
  basePath;
  /**
   * override server index
   *
   * @type {number}
   * @memberof Configuration
   */
  serverIndex;
  /**
   * base options for axios calls
   *
   * @type {any}
   * @memberof Configuration
   */
  baseOptions;
  /**
   * The FormData constructor that will be used to create multipart form data
   * requests. You can inject this here so that execution environments that
   * do not support the FormData class can still run the generated client.
   *
   * @type {new () => FormData}
   */
  formDataCtor;
  constructor(param = {}) {
    this.apiKey = param.apiKey;
    this.username = param.username;
    this.password = param.password;
    this.accessToken = param.accessToken;
    this.basePath = param.basePath;
    this.serverIndex = param.serverIndex;
    this.baseOptions = param.baseOptions;
    this.formDataCtor = param.formDataCtor;
  }
  /**
   * Check if the given MIME is a JSON MIME.
   * JSON MIME examples:
   *   application/json
   *   application/json; charset=UTF8
   *   APPLICATION/JSON
   *   application/vnd.company+json
   * @param mime - MIME (Multipurpose Internet Mail Extensions)
   * @return True if the given MIME is JSON, false otherwise.
   */
  isJsonMime(mime) {
    const jsonMime = new RegExp("^(application/json|[^;/ 	]+/[^;/ 	]+[+]json)[ 	]*(;.*)?$", "i");
    return mime !== null && (jsonMime.test(mime) || mime.toLowerCase() === "application/json-patch+json");
  }
}

export { Configuration };
//# sourceMappingURL=configuration.esm.js.map
