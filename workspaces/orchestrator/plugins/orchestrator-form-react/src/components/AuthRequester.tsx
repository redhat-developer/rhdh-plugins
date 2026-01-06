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
import { useEffect } from 'react';

import { JsonObject } from '@backstage/types';

import { Widget } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import { AuthTokenDescriptor } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

type UiProps = {
  authTokenDescriptors?: AuthTokenDescriptor[];
};

export const AuthRequester: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const setAuthTokenDescriptors = props.formContext?.setAuthTokenDescriptors;
  const uiProps = (props.options?.props ?? {}) as UiProps;

  useEffect(() => {
    if (setAuthTokenDescriptors) {
      setAuthTokenDescriptors(uiProps.authTokenDescriptors || []);
    }
  }, [setAuthTokenDescriptors, uiProps.authTokenDescriptors]);

  return <></>;
};
