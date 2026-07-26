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

import { JsonObject } from '@backstage/types';

import {
  AuthTokenDescriptor,
  isJsonObject,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { deepSearchObject } from '../../utils/deepSearchObject';

// For re-trigger, the wizard is not rendered, so there is no place where to instantiate the AuthRequester widget.
// Let's parse the data input schema and try to find & interpret it.
export const getAuthTokenDescriptors = async (
  dataInputSchema: JsonObject | undefined,
): Promise<AuthTokenDescriptor[] | undefined> => {
  if (!dataInputSchema) {
    return undefined;
  }

  const authRequester = deepSearchObject(
    dataInputSchema,
    (obj: JsonObject): boolean => {
      const uiWidget = obj['ui:widget'];
      const uiProps = obj['ui:props'];

      const authTokenDescriptors = isJsonObject(uiProps)
        ? uiProps.authTokenDescriptors
        : undefined;
      return (
        uiWidget === 'AuthRequester' && Array.isArray(authTokenDescriptors)
      );
    },
  );
  if (!authRequester) {
    return undefined;
  }

  const uiProps = (authRequester as JsonObject)['ui:props'] as JsonObject;
  return uiProps.authTokenDescriptors as AuthTokenDescriptor[];
};

export const isAbortableState = (
  state: ProcessInstanceStatusDTO | undefined,
): boolean =>
  state === ProcessInstanceStatusDTO.Active ||
  state === ProcessInstanceStatusDTO.Error;

export const isRerunnableState = (
  state: ProcessInstanceStatusDTO | undefined,
): boolean =>
  state === ProcessInstanceStatusDTO.Completed ||
  state === ProcessInstanceStatusDTO.Aborted ||
  state === ProcessInstanceStatusDTO.Error;
