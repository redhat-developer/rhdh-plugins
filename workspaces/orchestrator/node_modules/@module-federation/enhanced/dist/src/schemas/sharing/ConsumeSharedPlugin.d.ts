declare const _default: {
    readonly definitions: {
        readonly Consumes: {
            readonly description: "Modules that should be consumed from share scope. When provided, property names are used to match requested modules in this compilation.";
            readonly anyOf: readonly [{
                readonly type: "array";
                readonly items: {
                    readonly description: "Modules that should be consumed from share scope.";
                    readonly anyOf: readonly [{
                        readonly $ref: "#/definitions/ConsumesItem";
                    }, {
                        readonly $ref: "#/definitions/ConsumesObject";
                    }];
                };
            }, {
                readonly $ref: "#/definitions/ConsumesObject";
            }];
        };
        readonly ConsumesConfig: {
            readonly description: "Advanced configuration for modules that should be consumed from share scope.";
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly eager: {
                    readonly description: "Include the fallback module directly instead behind an async request. This allows to use fallback module in initial load too. All possible shared modules need to be eager too.";
                    readonly type: "boolean";
                };
                readonly import: {
                    readonly description: "Fallback module if no shared module is found in share scope. Defaults to the property name.";
                    readonly anyOf: readonly [{
                        readonly description: "No fallback module.";
                        readonly enum: readonly [false];
                    }, {
                        readonly $ref: "#/definitions/ConsumesItem";
                    }];
                };
                readonly packageName: {
                    readonly description: "Package name to determine required version from description file. This is only needed when package name can't be automatically determined from request.";
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly requiredVersion: {
                    readonly description: "Version requirement from module in share scope.";
                    readonly anyOf: readonly [{
                        readonly description: "No version requirement check.";
                        readonly enum: readonly [false];
                    }, {
                        readonly description: "Version as string. Can be prefixed with '^' or '~' for minimum matches. Each part of the version should be separated by a dot '.'.";
                        readonly type: "string";
                    }];
                };
                readonly shareKey: {
                    readonly description: "Module is looked up under this key from the share scope.";
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly shareScope: {
                    readonly description: "Share scope name.";
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly singleton: {
                    readonly description: "Allow only a single version of the shared module in share scope (disabled by default).";
                    readonly type: "boolean";
                };
                readonly strictVersion: {
                    readonly description: "Do not accept shared module if version is not valid (defaults to yes, if local fallback module is available and shared module is not a singleton, otherwise no, has no effect if there is no required version specified).";
                    readonly type: "boolean";
                };
            };
        };
        readonly ConsumesItem: {
            readonly description: "A module that should be consumed from share scope.";
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly ConsumesObject: {
            readonly description: "Modules that should be consumed from share scope. Property names are used to match requested modules in this compilation. Relative requests are resolved, module requests are matched unresolved, absolute paths will match resolved requests. A trailing slash will match all requests with this prefix. In this case shareKey must also have a trailing slash.";
            readonly type: "object";
            readonly additionalProperties: {
                readonly description: "Modules that should be consumed from share scope.";
                readonly anyOf: readonly [{
                    readonly $ref: "#/definitions/ConsumesConfig";
                }, {
                    readonly $ref: "#/definitions/ConsumesItem";
                }];
            };
        };
    };
    readonly title: "ConsumeSharedPluginOptions";
    readonly description: "Options for consuming shared modules.";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly consumes: {
            readonly $ref: "#/definitions/Consumes";
        };
        readonly shareScope: {
            readonly description: "Share scope name used for all consumed modules (defaults to 'default').";
            readonly type: "string";
            readonly minLength: 1;
        };
    };
    readonly required: readonly ["consumes"];
};
export default _default;
