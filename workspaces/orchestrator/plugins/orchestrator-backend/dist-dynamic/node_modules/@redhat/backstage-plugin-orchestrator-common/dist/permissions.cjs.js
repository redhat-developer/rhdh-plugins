'use strict';

var pluginPermissionCommon = require('@backstage/plugin-permission-common');

const orchestratorWorkflowPermission = pluginPermissionCommon.createPermission({
  name: "orchestrator.workflow",
  attributes: {
    action: "read"
  }
});
const orchestratorWorkflowSpecificPermission = (workflowId) => pluginPermissionCommon.createPermission({
  name: `orchestrator.workflow.${workflowId}`,
  attributes: {
    action: "read"
  }
});
const orchestratorWorkflowUsePermission = pluginPermissionCommon.createPermission({
  name: "orchestrator.workflow.use",
  attributes: {
    action: "update"
  }
});
const orchestratorWorkflowUseSpecificPermission = (workflowId) => pluginPermissionCommon.createPermission({
  name: `orchestrator.workflow.use.${workflowId}`,
  attributes: {
    action: "update"
  }
});
const orchestratorAdminViewPermission = pluginPermissionCommon.createPermission({
  name: "orchestrator.workflowAdminView",
  attributes: {
    action: "read"
  }
});
const orchestratorInstanceAdminViewPermission = pluginPermissionCommon.createPermission({
  name: "orchestrator.instanceAdminView",
  attributes: {
    action: "read"
  }
});
const orchestratorPermissions = [
  orchestratorWorkflowPermission,
  orchestratorWorkflowUsePermission,
  orchestratorAdminViewPermission,
  orchestratorInstanceAdminViewPermission
];

exports.orchestratorAdminViewPermission = orchestratorAdminViewPermission;
exports.orchestratorInstanceAdminViewPermission = orchestratorInstanceAdminViewPermission;
exports.orchestratorPermissions = orchestratorPermissions;
exports.orchestratorWorkflowPermission = orchestratorWorkflowPermission;
exports.orchestratorWorkflowSpecificPermission = orchestratorWorkflowSpecificPermission;
exports.orchestratorWorkflowUsePermission = orchestratorWorkflowUsePermission;
exports.orchestratorWorkflowUseSpecificPermission = orchestratorWorkflowUseSpecificPermission;
//# sourceMappingURL=permissions.cjs.js.map
