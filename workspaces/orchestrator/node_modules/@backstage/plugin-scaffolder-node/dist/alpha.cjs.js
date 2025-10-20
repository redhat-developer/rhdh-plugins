'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var serializer = require('./tasks/serializer.cjs.js');
var createTemplateFilter = require('./alpha/filters/createTemplateFilter.cjs.js');
var createTemplateGlobal = require('./alpha/globals/createTemplateGlobal.cjs.js');

const scaffolderActionsExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "scaffolder.actions"
});
const scaffolderTaskBrokerExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "scaffolder.taskBroker"
});
const scaffolderTemplatingExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "scaffolder.templating"
});
const scaffolderAutocompleteExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "scaffolder.autocomplete"
});
const scaffolderWorkspaceProviderExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "scaffolder.workspace.provider"
});

exports.restoreWorkspace = serializer.restoreWorkspace;
exports.serializeWorkspace = serializer.serializeWorkspace;
exports.createTemplateFilter = createTemplateFilter.createTemplateFilter;
exports.createTemplateGlobalFunction = createTemplateGlobal.createTemplateGlobalFunction;
exports.createTemplateGlobalValue = createTemplateGlobal.createTemplateGlobalValue;
exports.scaffolderActionsExtensionPoint = scaffolderActionsExtensionPoint;
exports.scaffolderAutocompleteExtensionPoint = scaffolderAutocompleteExtensionPoint;
exports.scaffolderTaskBrokerExtensionPoint = scaffolderTaskBrokerExtensionPoint;
exports.scaffolderTemplatingExtensionPoint = scaffolderTemplatingExtensionPoint;
exports.scaffolderWorkspaceProviderExtensionPoint = scaffolderWorkspaceProviderExtensionPoint;
//# sourceMappingURL=alpha.cjs.js.map
