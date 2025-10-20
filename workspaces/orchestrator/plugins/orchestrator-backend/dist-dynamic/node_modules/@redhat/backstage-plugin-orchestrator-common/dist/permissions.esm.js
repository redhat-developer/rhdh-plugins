import { createPermission } from '@backstage/plugin-permission-common';

const orchestratorWorkflowPermission = createPermission({
  name: "orchestrator.workflow",
  attributes: {
    action: "read"
  }
});
const orchestratorWorkflowSpecificPermission = (workflowId) => createPermission({
  name: `orchestrator.workflow.${workflowId}`,
  attributes: {
    action: "read"
  }
});
const orchestratorWorkflowUsePermission = createPermission({
  name: "orchestrator.workflow.use",
  attributes: {
    action: "update"
  }
});
const orchestratorWorkflowUseSpecificPermission = (workflowId) => createPermission({
  name: `orchestrator.workflow.use.${workflowId}`,
  attributes: {
    action: "update"
  }
});
const orchestratorAdminViewPermission = createPermission({
  name: "orchestrator.workflowAdminView",
  attributes: {
    action: "read"
  }
});
const orchestratorInstanceAdminViewPermission = createPermission({
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

export { orchestratorAdminViewPermission, orchestratorInstanceAdminViewPermission, orchestratorPermissions, orchestratorWorkflowPermission, orchestratorWorkflowSpecificPermission, orchestratorWorkflowUsePermission, orchestratorWorkflowUseSpecificPermission };
//# sourceMappingURL=permissions.esm.js.map
