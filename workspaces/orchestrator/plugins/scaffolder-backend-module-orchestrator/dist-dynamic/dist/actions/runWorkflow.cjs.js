'use strict';

var pluginScaffolderNode = require('@backstage/plugin-scaffolder-node');
var axios = require('axios');
var utils = require('./utils.cjs.js');

const getError = (err) => {
  if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
    const error = new Error(err.response?.data?.error?.message);
    error.name = err.response?.data?.error?.name || "Error";
    return error;
  }
  return err;
};
function createRunWorkflowAction(discoveryService, authService) {
  return pluginScaffolderNode.createTemplateAction({
    id: "orchestrator:workflow:run",
    description: "Run a SonataFlow workflow.",
    supportsDryRun: true,
    schema: {
      input: {
        workflow_id: (z) => z.string().describe("The workflow identifier from the workflow definition."),
        target_entity: (z) => z.string().optional().describe("The target entity to run the workflow on."),
        parameters: (z) => z.record(z.string(), z.any()).describe("The workflow inputs.")
      }
    },
    async handler(ctx) {
      const template_entity = ctx.templateInfo?.entityRef;
      if (!template_entity) {
        throw new Error("No template entity");
      }
      const targetEntity = ctx.input.target_entity?.toString() ?? template_entity?.toString();
      const [targetEntityKind, targetEntityNamespace, targetEntityName] = targetEntity?.split(/[:\/]/) || [];
      if (!ctx.input.workflow_id) {
        throw new Error(
          "Missing required 'workflow_id' input. Ensure that the step invoking the 'orchestrator:workflow:run' action includes an explicit 'workflow_id' field in its input."
        );
      }
      const api = await utils.getOrchestratorApi(discoveryService);
      const reqConfigOption = await utils.getRequestConfigOption(authService, ctx);
      if (ctx.isDryRun) {
        ctx.logger.info(`Dry run complete`);
        return;
      }
      try {
        const { data } = await api.executeWorkflow(
          ctx.input.workflow_id,
          {
            inputData: ctx.input.parameters,
            targetEntity
          },
          reqConfigOption
        );
        ctx.output(
          "instanceUrl",
          `/orchestrator/entity/${targetEntityNamespace}/${targetEntityKind}/${targetEntityName}/${ctx.input.workflow_id}/${data.id}`
        );
      } catch (err) {
        throw getError(err);
      }
    }
  });
}

exports.createRunWorkflowAction = createRunWorkflowAction;
//# sourceMappingURL=runWorkflow.cjs.js.map
