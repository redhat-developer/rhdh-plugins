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

import { createApiRef, useApiHolder } from '@backstage/core-plugin-api';
import { JsonObject } from '@backstage/types';

import { FormProps } from '@rjsf/core';
import { ErrorSchema, UiSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import { AuthTokenDescriptor } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { defaultFormExtensionsApi } from './DefaultFormApi';

/**
/**
 * @public
 *
 */
export type OrchestratorFormContextProps = {
  schema: JSONSchema7;
  updateSchema: OrchestratorFormSchemaUpdater;
  numStepsInMultiStepSchema?: number;
  uiSchema: UiSchema<JsonObject, JSONSchema7>;
  formData: JsonObject;
  setFormData: (data: JsonObject) => void;
  children: React.ReactNode;
  onSubmit: (formData: JsonObject) => void;
  setAuthTokenDescriptors: (
    authTokenDescriptors: AuthTokenDescriptor[],
  ) => void;
  getIsChangedByUser: (id: string) => boolean;
  setIsChangedByUser: (id: string, isChangedByUser: boolean) => void;
  handleFetchStarted?: () => void;
  handleFetchEnded?: () => void;
};

/**
 * @public
 * FormDecoratorProps
 *
 * Type definition for properties passed to a form decorator component.
 * This interface extends selected fields from `FormProps` provided by `react-jsonschema-form`,
 * with additional custom functionality.
 *
 * @see {@link https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props|RJSF Form Props Documentation}
 *
 * Core properties include:
 * - formData: The form's current data
 * - formContext: Contextual data shared across form components
 * - widgets: Custom widget components for form fields
 * - onChange: Handler for form data changes
 * - customValidate: Custom validation function
 *
 * Additional properties:
 * - getExtraErrors: Async function to fetch additional validation errors.
 *   This replaces the static 'extraErrors' prop from react-jsonschema-form, which can't be used as is, since onSubmit isn't exposed.
 *   The orchestrator form component will call getExtraErrors when running onSubmit.
 */
export type FormDecoratorProps = Pick<
  FormProps<JsonObject, JSONSchema7, OrchestratorFormContextProps>,
  | 'formData'
  | 'formContext'
  | 'widgets'
  | 'onChange'
  | 'customValidate'
  | 'templates'
> & {
  getExtraErrors?: (
    formData: JsonObject,
    uiSchema: OrchestratorFormContextProps['uiSchema'],
  ) => Promise<ErrorSchema<JsonObject>> | undefined;
};

/**
 * @public
 * OrchestratorFormDecorator
 *
 */
export type OrchestratorFormDecorator = (
  FormComponent: React.ComponentType<FormDecoratorProps>,
) => React.ComponentType<OrchestratorFormContextProps>;

/**
 * @public
 *
 * Expected response received by fetch:url of the SchemaUpdater widget.
 *
 * Key is the JSON Schema placeholder identifier,
 * Value is content the key will be newly assigned to.
 */
export type SchemaChunksResponse = {
  [key: string]: JsonObject;
};

/**
 * @public
 *
 * Function provided by the Orchestrator down to the OrchestratorFormApi to update the form's JSON Schema on the fly.
 */
export type OrchestratorFormSchemaUpdater = (
  chunks: SchemaChunksResponse,
) => void;

/**
 * @public
 * OrchestratorFormApi
 * API to be implemented by factory in a custom plugin
 */
export interface OrchestratorFormApi {
  /**
   * @public
   * Context wrapping the RJSF form on Workflow execution page, making it available for the custom widgets.
   *
   * Must be created by the API to share just a single instance within both the OrchestratorFormApi and
   * the Orchestrator where the context is actually provided (see OrchestratorFormWrapper).
   */
  // getFormContext(): Context<OrchestratorFormContextProps | null>;

  /**
   * @public
   * getFormDecorator
   * return the form decorator
   */
  getFormDecorator(): OrchestratorFormDecorator;
}

/**
 * @public
 * OrchestratorFormApiRef
 *
 */
export const orchestratorFormApiRef = createApiRef<OrchestratorFormApi>({
  id: 'plugin.orchestrator.form',
});

export const useOrchestratorFormApiOrDefault = (): OrchestratorFormApi =>
  useApiHolder().get(orchestratorFormApiRef) ?? defaultFormExtensionsApi;
