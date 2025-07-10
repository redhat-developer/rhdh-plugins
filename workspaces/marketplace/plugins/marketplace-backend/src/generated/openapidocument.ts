/*
 * Copyright The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// eslint-disable
// prettier-ignore
const OPENAPI = `
{
  "openapi": "3.1.0",
  "info": {
    "version": "1.0",
    "title": "Extension Backend",
    "description": "The Extension Backend APIs allow users to access and manage plugins."
  },
  "servers": [
    {
      "url": "{protocol}://{host}:{port}/{basePath}",
      "variables": {
        "protocol": {
          "enum": [
            "http",
            "https"
          ],
          "default": "http"
        },
        "host": {
          "default": "localhost"
        },
        "port": {
          "default": "7007"
        },
        "basePath": {
          "default": "api/extensions/"
        }
      }
    }
  ],
  "components": {
    "schemas": {
      "PluginConfigurationResponse": {
        "type": "object",
        "properties": {
          "configYaml": {
            "type": "string",
            "description": "YAML configuration content as a plain string",
            "example": "- package: ./dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic\\n  disabled: false\\n"
          }
        }
      },
      "PluginPackageListResponse": {
        "type": "array",
        "items": {
          "type": "string",
          "example": "backstage-community-plugin-3scale-backend"
        }
      },
      "PluginDisableRequest": {
        "type": "object",
        "required": [
          "disabled"
        ],
        "properties": {
          "disabled": {
            "type": "boolean",
            "example": true
          }
        }
      },
      "PluginConfigurationStatusResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "example": "OK"
          }
        }
      },
      "PluginAuthorizationResponse": {
        "type": "object",
        "properties": {
          "read": {
            "type": "string",
            "enum": [
              "ALLOW",
              "DENY"
            ],
            "example": "ALLOW"
          },
          "write": {
            "type": "string",
            "enum": [
              "ALLOW",
              "DENY"
            ],
            "example": "DENY"
          }
        },
        "required": [
          "read",
          "write"
        ]
      },
      "PluginInstallationConfigResponse": {
        "type": "object",
        "properties": {
          "enabled": {
            "type": "boolean",
            "example": true
          }
        }
      },
      "Plugin": {
        "type": "object",
        "properties": {
          "metadata": {
            "type": "object",
            "properties": {
              "annotations": {
                "type": "object",
                "additionalProperties": {
                  "type": "string"
                }
              },
              "namespace": {
                "type": "string",
                "example": "marketplace-plugin-demo"
              },
              "name": {
                "type": "string",
                "example": "3scale"
              },
              "title": {
                "type": "string",
                "example": "APIs with 3scale"
              },
              "description": {
                "type": "string",
                "example": "Synchronize 3scale content into the Backstage catalog."
              },
              "tags": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "uid": {
                "type": "string",
                "format": "uuid",
                "example": "9f94bfb5-4a70-4a7a-b56c-9a5cb8ac18f2"
              },
              "etag": {
                "type": "string",
                "example": "0cb7607f982608c01e424e951694f8b22632daf5"
              }
            }
          },
          "apiVersion": {
            "type": "string",
            "example": "extensions.backstage.io/v1alpha1"
          },
          "kind": {
            "type": "string",
            "example": "Plugin"
          },
          "spec": {
            "type": "object",
            "properties": {
              "icon": {
                "type": "string",
                "format": "uri",
                "example": "https://janus-idp.io/images/plugins/3scale.svg"
              },
              "categories": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "highlights": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "support": {
                "type": "string",
                "example": "asd"
              },
              "lifecycle": {
                "type": "string",
                "example": "production"
              },
              "packages": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "installStatus": {
                "type": "string",
                "enum": [
                  "Installed",
                  "NotInstalled",
                  "UpdateAvailable",
                  "Disabled"
                ],
                "example": "NotInstalled"
              },
              "authors": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "relations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "example": "hasPart"
                },
                "targetRef": {
                  "type": "string",
                  "example": "package:marketplace-plugin-demo/backstage-community-plugin-3scale-backend"
                }
              }
            }
          }
        }
      }
    },
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Backstage Permissions Framework JWT"
      }
    }
  },
  "paths": {
    "/plugins": {
      "get": {
        "summary": "List available plugins",
        "operationId": "getPlugins",
        "tags": [
          "Plugins"
        ],
        "parameters": [
          {
            "name": "filter",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter query for plugins"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            },
            "description": "Number of items to return"
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            },
            "description": "Pagination offset"
          }
        ],
        "responses": {
          "200": {
            "description": "A list of plugins",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Plugin"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/plugin/{namespace}/{name}/configuration/authorize": {
      "get": {
        "summary": "Check plugin authorization for read/write actions",
        "operationId": "getPluginConfigAuthorization",
        "tags": [
          "Plugins"
        ],
        "parameters": [
          {
            "name": "namespace",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "default": "default"
            },
            "description": "Namespace of the plugin"
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Name of the plugin"
          }
        ],
        "responses": {
          "200": {
            "description": "Authorization result for plugin configuration",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginAuthorizationResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "BearerAuth": []
          }
        ]
      }
    },
    "/plugins/configure": {
      "get": {
        "summary": "Check if plugin installation is enabled",
        "operationId": "getExtensionsConfiguration",
        "tags": [
          "Plugins"
        ],
        "responses": {
          "200": {
            "description": "Evaluates if the plugin installation is enabled",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginInstallationConfigResponse"
                }
              }
            }
          }
        }
      }
    },
    "/plugin/{namespace}/{name}/configuration": {
      "get": {
        "summary": "Get plugin configuration YAML",
        "operationId": "getPluginConfigByName",
        "tags": [
          "Plugins"
        ],
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "namespace",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "default": "default"
            }
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Plugin configuration",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginConfigurationResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      },
      "post": {
        "summary": "Install or update plugin configuration",
        "operationId": "installPlugin",
        "tags": [
          "Plugins"
        ],
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "configYaml"
                ],
                "properties": {
                  "configYaml": {
                    "type": "string",
                    "description": "YAML string of configuration"
                  }
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "namespace",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "default": "default"
            }
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successfully updated plugin configuration",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginConfigurationStatusResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid configuration or missing configYaml"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/plugin/{namespace}/{name}/configuration/disable": {
      "patch": {
        "summary": "Disable or enable a plugin",
        "operationId": "disablePlugin",
        "tags": [
          "Plugins"
        ],
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PluginDisableRequest"
              }
            }
          }
        },
        "parameters": [
          {
            "name": "namespace",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "default": "default"
            }
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Plugin disabled/enabled successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginConfigurationStatusResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request body"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/plugin/{namespace}/{name}/packages": {
      "get": {
        "summary": "Get packages associated with a plugin",
        "operationId": "getPluginPackages",
        "tags": [
          "Plugins"
        ],
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "namespace",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "default": "default"
            },
            "description": "Plugin namespace"
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Plugin name"
          }
        ],
        "responses": {
          "200": {
            "description": "List of packages for the plugin",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PluginPackageListResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/environment": {
      "get": {
        "summary": "Get the current Node environment",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "operationId": "getNodeEnvironment",
        "tags": [
          "System"
        ],
        "responses": {
          "200": {
            "description": "Successfully retrieved node environment",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "nodeEnv": {
                      "type": "string",
                      "enum": [
                        "development",
                        "production",
                        "test"
                      ],
                      "example": "development"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
export const openApiDocument = JSON.parse(OPENAPI);
