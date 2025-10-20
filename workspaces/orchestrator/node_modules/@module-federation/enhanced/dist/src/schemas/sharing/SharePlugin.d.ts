declare const _default: {
    readonly definitions: {
        readonly Shared: {
            readonly description: "Modules that should be shared in the share scope. When provided, property names are used to match requested modules in this compilation.";
            readonly anyOf: readonly [{
                readonly type: "array";
                readonly items: {
                    readonly description: "Modules that should be shared in the share scope.";
                    readonly anyOf: readonly [{
                        readonly $ref: "#/definitions/SharedItem";
                    }, {
                        readonly $ref: "#/definitions/SharedObject";
                    }];
                };
            }, {
                readonly $ref: "#/definitions/SharedObject";
            }];
        };
        readonly SharedConfig: {
            readonly description: "Advanced configuration for modules that should be shared in the share scope.";
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly eager: {
                    readonly description: "Include the provided and fallback module directly instead behind an async request. This allows to use this shared module in initial load too. All possible shared modules need to be eager too.";
                    readonly type: "boolean";
                };
                readonly import: {
                    readonly description: "Provided module that should be provided to share scope. Also acts as fallback module if no shared module is found in share scope or version isn't valid. Defaults to the property name.";
                    readonly anyOf: readonly [{
                        readonly description: "No provided or fallback module.";
                        readonly enum: readonly [false];
                    }, {
                        readonly $ref: "#/definitions/SharedItem";
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
                readonly version: {
                    readonly description: "Version of the provided module. Will replace lower matching versions, but not higher.";
                    readonly anyOf: readonly [{
                        readonly description: "Don't provide a version.";
                        readonly enum: readonly [false];
                    }, {
                        readonly description: "Version as string. Each part of the version should be separated by a dot '.'.";
                        readonly type: "string";
                    }];
                };
            };
        };
        readonly SharedItem: {
            readonly description: "A module that should be shared in the share scope.";
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly SharedObject: {
            readonly description: "Modules that should be shared in the share scope. Property names are used to match requested modules in this compilation. Relative requests are resolved, module requests are matched unresolved, absolute paths will match resolved requests. A trailing slash will match all requests with this prefix. In this case shareKey must also have a trailing slash.";
            readonly type: "object";
            readonly additionalProperties: {
                readonly description: "Modules that should be shared in the share scope.";
                readonly anyOf: readonly [{
                    readonly $ref: "#/definitions/SharedConfig";
                }, {
                    readonly $ref: "#/definitions/SharedItem";
                }];
            };
        };
    };
    readonly title: "SharePluginOptions";
    readonly description: "Options for shared modules.";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly shareScope: {
            readonly description: "Share scope name used for all shared modules (defaults to 'default').";
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly shared: {
            readonly $ref: "#/definitions/Shared";
        };
    };
    readonly required: readonly ["shared"];
};
export default _default;
