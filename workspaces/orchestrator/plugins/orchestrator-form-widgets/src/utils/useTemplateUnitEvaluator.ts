/*
 * Copyright Red Hat, Inc.
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
import { useCallback, useMemo } from 'react';
import get from 'lodash/get';
import { JsonObject } from '@backstage/types';
import {
  AnyApiFactory,
  ApiHolder,
  ApiRef,
  atlassianAuthApiRef,
  BackstagePlugin,
  ConfigApi,
  configApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
  googleAuthApiRef,
  IdentityApi,
  identityApiRef,
  microsoftAuthApiRef,
  OAuthApi,
  OpenIdConnectApi,
  ProfileInfoApi,
  SessionApi,
  useApi,
  useApiHolder,
  useApp,
} from '@backstage/core-plugin-api';
import { isFetchResponseKey, UiProps } from '../uiPropTypes';
import { applySelectorString } from './applySelector';

export type ScmApi = OAuthApi & ProfileInfoApi;
export type ScmOpenIdApi = ScmApi & OpenIdConnectApi;

const templateUnitEvaluatorIdentityApi = async (
  identityApi: IdentityApi,
  key: string,
) => {
  if (key === 'token') {
    return (await identityApi.getCredentials()).token;
  }
  if (key === 'userEntityRef') {
    return (await identityApi.getBackstageIdentity()).userEntityRef;
  }
  if (key === 'profileEmail') {
    return (await identityApi.getProfileInfo()).email;
  }
  if (key === 'displayName') {
    return (await identityApi.getProfileInfo()).displayName;
  }
  throw new Error(`Unknown template key "${key}" in "identityApi"`);
};

const templateUnitEvaluatorSCM = async (
  scmApis: { [key: string]: ScmApi },
  keyFamily: string,
  key: string,
) => {
  if (key === 'token') {
    return await scmApis[keyFamily].getAccessToken();
  }
  if (key === 'profileEmail') {
    return (await scmApis[keyFamily].getProfile())?.email;
  }
  if (key === 'profileName') {
    return (await scmApis[keyFamily].getProfile())?.displayName;
  }
  throw new Error(`Unknown template key "${key}" in "${keyFamily}"`);
};

const templateUnitEvaluatorOpenId = async (
  scmOpenIdApis: { [key: string]: ScmOpenIdApi },
  keyFamily: string,
  key: string,
) => {
  if (key === 'token') {
    return await scmOpenIdApis[keyFamily].getAccessToken();
  }
  if (key === 'openIdToken') {
    return await scmOpenIdApis[keyFamily].getIdToken();
  }
  if (key === 'profileEmail') {
    return (await scmOpenIdApis[keyFamily].getProfile())?.email;
  }
  if (key === 'profileName') {
    return (await scmOpenIdApis[keyFamily].getProfile())?.displayName;
  }
  throw new Error(`Unknown template key "${key}" in "${keyFamily}"`);
};

const templateUnitEvaluatorCustomAuthApi = async (
  apiHolder: ApiHolder,
  allPlugins: BackstagePlugin[],
  providerKey: string,
) => {
  const providerApiId = providerKey.substring(0, providerKey.lastIndexOf('.'));
  const key = providerKey.substring(providerKey.lastIndexOf('.') + 1);

  const apiRef = allPlugins
    .flatMap(plugin => Array.from(plugin.getApis()))
    .filter((api: AnyApiFactory) => api.api.id === providerApiId)
    .at(0)?.api as
    | ApiRef<OpenIdConnectApi & OAuthApi & ProfileInfoApi & SessionApi>
    | undefined;

  if (!apiRef) {
    throw new Error(
      `Unknown custom auth provider API of id "${providerApiId}". The provider id must match its ApiRef id, unit example: customAuthApi.my.auth.github-two.token , so: [KEY_FAMILY].[PLUGIN_ID].[PROVIDER_ID].[KEY] for provider id "my.auth.github-two".`,
    );
  }

  const api = apiHolder.get(apiRef);
  if (!api) {
    throw new Error(`No implementation available for ${apiRef}`);
  }

  if (key === 'token') {
    if (api.getAccessToken) {
      return await api.getAccessToken();
    }
    throw new Error(
      `The ${apiRef} API does not provide a getAccessToken method.`,
    );
  }

  if (key === 'openIdToken') {
    if (api.getIdToken) {
      return await api.getIdToken();
    }
    throw new Error(
      `The ${apiRef} API does not provide a OpenIdConnectApi method.`,
    );
  }

  if (key === 'profileEmail') {
    if (api.getProfile) {
      return (await api.getProfile())?.email;
    }
    throw new Error(`The ${apiRef} API does not provide a getProfile method.`);
  }

  if (key === 'profileName') {
    if (api.getProfile) {
      return (await api.getProfile())?.displayName;
    }
    throw new Error(`The ${apiRef} API does not provide a getProfile method.`);
  }

  throw new Error(
    `Unknown template key "${key}" for custom provider "${providerApiId}" API in "${providerKey}"`,
  );
};

const templateUnitEvaluatorBackend = (configApi: ConfigApi, key: string) => {
  if (key === 'baseUrl') {
    return configApi.getString('backend.baseUrl');
  }
  throw new Error(`Unknown template key "${key}" in "backend"`);
};

export const useTemplateUnitEvaluator = () => {
  const app = useApp();
  const apiHolder = useApiHolder();
  const configApi = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);
  const githubAuthApi = useApi(githubAuthApiRef);
  const atlassianAuthApi = useApi(atlassianAuthApiRef);
  const googleAuthApi = useApi(googleAuthApiRef);
  const microsoftAuthApi = useApi(microsoftAuthApiRef);
  const gitlabAuthApi = useApi(gitlabAuthApiRef);

  const scmApis = useMemo<{ [key: string]: ScmApi }>(
    () => ({
      githubAuthApi,
      atlassianAuthApi,
    }),
    [githubAuthApi, atlassianAuthApi],
  );

  const scmOpenIdApis = useMemo<{ [key: string]: ScmOpenIdApi }>(
    () => ({
      googleAuthApi,
      microsoftAuthApi,
      gitlabAuthApi,
    }),
    [googleAuthApi, microsoftAuthApi, gitlabAuthApi],
  );

  const allPlugins = useMemo(() => app.getPlugins(), [app]);

  return useCallback(
    async (
      unit: string,
      formData: JsonObject,
      responseData?: JsonObject,
      uiProps?: UiProps,
    ) => {
      if (!unit) {
        throw new Error('Template unit can not be empty');
      }

      const keyFamily = unit.substring(0, unit.indexOf('.'));
      const key = unit.substring(unit.indexOf('.') + 1);
      if (keyFamily === 'current') {
        return get(formData, key);
      }

      if (keyFamily === 'backend') {
        return templateUnitEvaluatorBackend(configApi, key);
      }

      if (keyFamily === 'rjsfConfig') {
        // Mind setting frontend visibility in configuration: https://backstage.io/docs/conf/defining/#visibility
        return configApi.getOptionalString(`orchestrator.rjsf-widgets.${key}`);
      }

      if (keyFamily === 'identityApi') {
        return await templateUnitEvaluatorIdentityApi(identityApi, key);
      }

      if (keyFamily === 'customAuthApi') {
        // unit example: customAuthApi.my.auth.github-two.token , so: [KEY_FAMILY].[PLUGIN_ID].[PROVIDER_ID].[KEY]
        return await templateUnitEvaluatorCustomAuthApi(
          apiHolder,
          allPlugins,
          key,
        );
      }

      if (scmApis[keyFamily]) {
        return await templateUnitEvaluatorSCM(scmApis, keyFamily, key);
      }

      if (scmOpenIdApis[keyFamily]) {
        return await templateUnitEvaluatorOpenId(scmOpenIdApis, keyFamily, key);
      }

      if (isFetchResponseKey(unit)) {
        if (!uiProps?.[unit]) {
          throw new Error(
            `Template evaluation error: The ui property '${unit}' does not exist in the schema ui:props.`,
          );
        }
        if (!responseData) {
          throw new Error(
            `Template evaluation error: Attempting to access fetched data for ui property '${unit}', but the fetch response is undefined.`,
          );
        }
        const selector = uiProps[unit];
        if (typeof selector !== 'string') {
          throw new Error(
            `Template evaluation error: The selector for '${unit}' must be a string (JSONata expression), but got ${typeof selector}.`,
          );
        }
        return await applySelectorString(responseData, selector);
      }

      throw new Error(`Unknown template unit "${unit}"`);
    },
    [configApi, identityApi, scmApis, scmOpenIdApis, apiHolder, allPlugins],
  );
};
