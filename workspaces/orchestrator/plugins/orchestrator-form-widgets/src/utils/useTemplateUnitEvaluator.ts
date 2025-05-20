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
import { get } from 'lodash';
import { JsonObject } from '@backstage/types';
import {
  atlassianAuthApiRef,
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
  useApi,
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

const templateUnitEvaluatorBackend = (configApi: ConfigApi, key: string) => {
  if (key === 'baseUrl') {
    return configApi.getString('backend.baseUrl');
  }
  throw new Error(`Unknown template key "${key}" in "backend"`);
};

export const useTemplateUnitEvaluator = () => {
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
        return await applySelectorString(responseData, uiProps[unit]);
      }

      throw new Error(`Unknown template unit "${unit}"`);
    },
    [configApi, identityApi, scmApis, scmOpenIdApis],
  );
};
