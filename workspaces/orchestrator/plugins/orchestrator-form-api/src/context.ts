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

import { JsonObject } from '@backstage/types';

import { UiSchema } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';

import { OrchestratorFormSchemaUpdater } from './api';

/**
 * @public
 */
export type OrchestratorFormContextProps = {
  schema: JSONSchema7;
  updateSchema: OrchestratorFormSchemaUpdater;
  numStepsInMultiStepSchema?: number;
  children: React.ReactNode;
  onSubmit: (formData: JsonObject) => void;
  uiSchema: UiSchema<JsonObject, JSONSchema7>;
  formData: JsonObject;
  setFormData: (data: JsonObject) => void;
};

/**
 * Context wrapping RJSF form on the Workflow execution page, making it available for the custom widgets.
 * @public
 */
export const WrapperFormPropsContext =
  React.createContext<OrchestratorFormContextProps | null>(null);

/**
 * @public
 *
 * Simplifies access to the form context in widgets.
 */
export const useWrapperFormPropsContext = (): OrchestratorFormContextProps => {
  const context = React.useContext(WrapperFormPropsContext);
  if (context === null) {
    throw new Error('OrchestratorFormWrapperProps not provided');
  }
  return context;
};
