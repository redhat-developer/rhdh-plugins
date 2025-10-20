import { ApiDOMError } from '@swagger-api/apidom-error';
class PluginError extends ApiDOMError {
  plugin;
  constructor(message, options) {
    super(message, {
      cause: options.cause
    });
    this.plugin = options.plugin;
  }
}
export default PluginError;