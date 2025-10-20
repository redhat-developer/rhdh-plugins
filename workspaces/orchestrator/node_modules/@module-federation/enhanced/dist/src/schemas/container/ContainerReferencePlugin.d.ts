declare const _default: {
    readonly definitions: {
        readonly ExternalsType: {
            readonly description: "Specifies the default type of externals ('amd*', 'umd*', 'system' and 'jsonp' depend on output.libraryTarget set to the same value).";
            readonly enum: readonly ["var", "module", "assign", "this", "window", "self", "global", "commonjs", "commonjs2", "commonjs-module", "commonjs-static", "amd", "amd-require", "umd", "umd2", "jsonp", "system", "promise", "import", "script", "node-commonjs"];
        };
        readonly Remotes: {
            readonly description: "Container locations and request scopes from which modules should be resolved and loaded at runtime. When provided, property name is used as request scope, otherwise request scope is automatically inferred from container location.";
            readonly anyOf: readonly [{
                readonly type: "array";
                readonly items: {
                    readonly description: "Container locations and request scopes from which modules should be resolved and loaded at runtime.";
                    readonly anyOf: readonly [{
                        readonly $ref: "#/definitions/RemotesItem";
                    }, {
                        readonly $ref: "#/definitions/RemotesObject";
                    }];
                };
            }, {
                readonly $ref: "#/definitions/RemotesObject";
            }];
        };
        readonly RemotesConfig: {
            readonly description: "Advanced configuration for container locations from which modules should be resolved and loaded at runtime.";
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly external: {
                    readonly description: "Container locations from which modules should be resolved and loaded at runtime.";
                    readonly anyOf: readonly [{
                        readonly $ref: "#/definitions/RemotesItem";
                    }, {
                        readonly $ref: "#/definitions/RemotesItems";
                    }];
                };
                readonly shareScope: {
                    readonly description: "The name of the share scope shared with this remote.";
                    readonly type: "string";
                    readonly minLength: 1;
                };
            };
            readonly required: readonly ["external"];
        };
        readonly RemotesItem: {
            readonly description: "Container location from which modules should be resolved and loaded at runtime.";
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly RemotesItems: {
            readonly description: "Container locations from which modules should be resolved and loaded at runtime.";
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/definitions/RemotesItem";
            };
        };
        readonly RemotesObject: {
            readonly description: "Container locations from which modules should be resolved and loaded at runtime. Property names are used as request scopes.";
            readonly type: "object";
            readonly additionalProperties: {
                readonly description: "Container locations from which modules should be resolved and loaded at runtime.";
                readonly anyOf: readonly [{
                    readonly $ref: "#/definitions/RemotesConfig";
                }, {
                    readonly $ref: "#/definitions/RemotesItem";
                }, {
                    readonly $ref: "#/definitions/RemotesItems";
                }];
            };
        };
    };
    readonly title: "ContainerReferencePluginOptions";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly remoteType: {
            readonly description: "The external type of the remote containers.";
            readonly oneOf: readonly [{
                readonly $ref: "#/definitions/ExternalsType";
            }];
        };
        readonly remotes: {
            readonly $ref: "#/definitions/Remotes";
        };
        readonly shareScope: {
            readonly description: "The name of the share scope shared with all remotes (defaults to 'default').";
            readonly type: "string";
            readonly minLength: 1;
        };
    };
    readonly required: readonly ["remoteType", "remotes"];
};
export default _default;
