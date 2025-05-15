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
import React from 'react';

import { useApiHolder } from '@backstage/core-plugin-api';

import {
  OrchestratorFormApi,
  orchestratorFormApiRef,
  OrchestratorFormContextProps,
} from './api';
import { defaultFormExtensionsApi } from './DefaultFormApi';

/**
 * @public
 *
 */
export const useOrchestratorFormApiOrDefault = (): OrchestratorFormApi =>
  useApiHolder().get(orchestratorFormApiRef) ?? defaultFormExtensionsApi;

/**
 * @public
 *
 * Simplifies access to the form context in widgets.
 */
export const useWrapperFormPropsContext = (): OrchestratorFormContextProps => {
  const formApi = useOrchestratorFormApiOrDefault();
  const context = React.useContext(formApi.getFormContext());

  if (context === null) {
    throw new Error('OrchestratorFormWrapperProps not provided');
  }
  return context;
};
