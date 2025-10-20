'use strict';

var pluginScaffolderNode = require('@backstage/plugin-scaffolder-node');
var axios = require('axios');
var jsYaml = require('js-yaml');
var utils = require('./utils.cjs.js');

const getError = (err) => {
  if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
    const error = new Error(err.response?.data?.error?.message);
    error.name = err.response?.data?.error?.name || "Error";
    return error;
  }
  return err;
};
const indentString = (str, indent) => indent ? str.replace(/^/gm, " ".repeat(indent)) : str;
function createGetWorkflowParamsAction(discoveryService, authService) {
  return pluginScaffolderNode.createTemplateAction({
    id: "orchestrator:workflow:get_params",
    description: "Collect parameters of a SonataFlow workflow.",
    supportsDryRun: false,
    schema: {
      input: {
        workflow_id: (z) => z.string().describe("Workflow Id"),
        indent: (z) => z.number().optional().describe("Number of indents")
      }
    },
    async handler(ctx) {
      const workflowId = ctx.input?.workflow_id;
      if (!workflowId) {
        throw new Error("Missing workflow_id required input parameter.");
      }
      const api = await utils.getOrchestratorApi(discoveryService);
      const reqConfigOption = await utils.getRequestConfigOption(authService, ctx);
      try {
        const { data: workflow } = await api.getWorkflowOverviewById(
          workflowId,
          reqConfigOption
        );
        if (!workflow) {
          throw new Error(`Can not find workflow ${workflowId}`);
        }
        const { data: inputSchemaWrapper } = await api.getWorkflowInputSchemaById(
          workflowId,
          void 0,
          reqConfigOption
        );
        const inputSchema = inputSchemaWrapper.inputSchema;
        ctx.output("title", workflow.name || workflowId);
        ctx.output("description", workflow.description || "");
        if (inputSchema?.properties) {
          let parametersYaml = jsYaml.dump(
            [
              // scaffolder expects an array on the top-level
              inputSchema
            ],
            { indent: 2 }
          );
          parametersYaml = indentString(parametersYaml, ctx.input?.indent || 0);
          parametersYaml = `
${parametersYaml}`;
          ctx.output("parameters", parametersYaml);
        } else {
          ctx.output("parameters", "{}");
        }
      } catch (err) {
        throw getError(err);
      }
    }
  });
}

exports.createGetWorkflowParamsAction = createGetWorkflowParamsAction;
//# sourceMappingURL=getWorkflowParams.cjs.js.map
