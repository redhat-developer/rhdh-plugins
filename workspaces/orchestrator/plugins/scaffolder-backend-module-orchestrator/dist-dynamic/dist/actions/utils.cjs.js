'use strict';

var axios = require('axios');
var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var axios__default = /*#__PURE__*/_interopDefaultCompat(axios);

const getOrchestratorApi = async (discoveryService) => {
  const baseUrl = await discoveryService.getBaseUrl("orchestrator");
  const config = new backstagePluginOrchestratorCommon.Configuration({});
  const axiosInstance = axios__default.default.create({
    baseURL: baseUrl
  });
  const api = new backstagePluginOrchestratorCommon.DefaultApi(config, baseUrl, axiosInstance);
  return api;
};
const getRequestConfigOption = async (authService, ctx) => {
  const { token } = await authService.getPluginRequestToken({
    onBehalfOf: await ctx.getInitiatorCredentials(),
    targetPluginId: "orchestrator"
  }) ?? { token: ctx.secrets?.backstageToken };
  const reqConfigOption = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  return reqConfigOption;
};

exports.getOrchestratorApi = getOrchestratorApi;
exports.getRequestConfigOption = getRequestConfigOption;
//# sourceMappingURL=utils.cjs.js.map
