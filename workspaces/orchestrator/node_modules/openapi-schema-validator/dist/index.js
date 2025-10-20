"use strict";
exports.__esModule = true;
var ajv_1 = require("ajv");
var ajv_formats_1 = require("ajv-formats");
var openapi2Schema = require('./resources/openapi-2.0.json');
var openapi3Schema = require('./resources/openapi-3.0.json');
var merge = require('lodash.merge');
var OpenAPISchemaValidator = /** @class */ (function () {
    function OpenAPISchemaValidator(args) {
        var v = new ajv_1["default"]({ allErrors: true, strict: false });
        (0, ajv_formats_1["default"])(v);
        var version = (args && parseInt(String(args.version), 10)) || 2;
        var schema = merge({}, version === 2 ? openapi2Schema : openapi3Schema, args ? args.extensions : {});
        v.addSchema(schema);
        this.validator = v.compile(schema);
    }
    OpenAPISchemaValidator.prototype.validate = function (openapiDoc) {
        if (!this.validator(openapiDoc)) {
            return { errors: this.validator.errors };
        }
        else {
            return { errors: [] };
        }
    };
    return OpenAPISchemaValidator;
}());
exports["default"] = OpenAPISchemaValidator;
//# sourceMappingURL=index.js.map