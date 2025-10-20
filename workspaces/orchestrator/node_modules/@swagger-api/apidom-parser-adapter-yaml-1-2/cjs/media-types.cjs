"use strict";

exports.__esModule = true;
exports.default = exports.YamlMediaTypes = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
class YamlMediaTypes extends _apidomCore.MediaTypes {
  latest() {
    return this[1];
  }
}
exports.YamlMediaTypes = YamlMediaTypes;
const mediaTypes = new YamlMediaTypes('text/yaml', 'application/yaml');
var _default = exports.default = mediaTypes;