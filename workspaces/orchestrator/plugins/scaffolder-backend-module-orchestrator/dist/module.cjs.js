'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var alpha = require('@backstage/plugin-scaffolder-node/alpha');
var runWorkflow = require('./actions/runWorkflow.cjs.js');
var getWorkflowParams = require('./actions/getWorkflowParams.cjs.js');

const scaffolderModule = backendPluginApi.createBackendModule({
  moduleId: "orchestrator",
  pluginId: "scaffolder",
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: alpha.scaffolderActionsExtensionPoint,
        discoveryService: backendPluginApi.coreServices.discovery,
        authService: backendPluginApi.coreServices.auth
      },
      async init({ scaffolderActions, discoveryService, authService }) {
        scaffolderActions.addActions(
          runWorkflow.createRunWorkflowAction(discoveryService, authService)
        );
        scaffolderActions.addActions(
          getWorkflowParams.createGetWorkflowParamsAction(discoveryService, authService)
        );
      }
    });
  }
});

exports.scaffolderModule = scaffolderModule;
//# sourceMappingURL=module.cjs.js.map
