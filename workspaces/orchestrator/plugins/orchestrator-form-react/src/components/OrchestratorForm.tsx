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

import { Fragment, useCallback, useMemo, useState } from 'react';

import { JsonObject } from '@backstage/types';

import { UiSchema } from '@rjsf/utils';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import generateUiSchema from '../utils/generateUiSchema';
import { StepperContextProvider } from '../utils/StepperContext';
import OrchestratorFormWrapper from './OrchestratorFormWrapper';
import ReviewStep from './ReviewStep';
import SingleStepForm from './SingleStepForm';

const getNumSteps = (schema: JSONSchema7): number | undefined => {
  if (schema.type !== 'object' || !schema.properties) return undefined;
  const isMultiStep = Object.values(schema.properties).every(
    prop => (prop as JSONSchema7).type === 'object',
  );
  return isMultiStep ? Object.keys(schema.properties).length : undefined;
};

/**
 * @public
 * OrchestratorForm component properties
 */
export type OrchestratorFormProps = {
  schema: JSONSchema7;
  updateSchema: OrchestratorFormContextProps['updateSchema'];
  setAuthTokenDescriptors: OrchestratorFormContextProps['setAuthTokenDescriptors'];
  isExecuting: boolean;
  handleExecute: (parameters: JsonObject) => Promise<void>;
  initialFormData: JsonObject;
};

/**
 * Remove hidden steps from the schema.
 *
 * A wizard step is removed when
 *   "type": "object"
 *   "ui:widget": "hidden"
 *   and properties are empty ("properties": {})
 *
 * @param schema - The schema to remove hidden steps from.
 * @returns The schema with hidden steps removed.
 */
const removeHiddenSteps = (schema: JSONSchema7): JSONSchema7 => {
  if (typeof schema.properties === 'object') {
    const hiddenSteps = Object.entries(schema.properties)
      .map(([key, value]: [string, JSONSchema7Definition]) => {
        const uiWidget = get(value, 'ui:widget');
        if (
          typeof value !== 'boolean' &&
          value.type === 'object' &&
          uiWidget === 'hidden' &&
          value.properties &&
          Object.keys(value.properties).length === 0
        ) {
          return key;
        }
        return undefined;
      })
      .filter(Boolean) as string[];

    if (hiddenSteps.length > 0) {
      const newSchema = cloneDeep(schema);
      hiddenSteps.forEach(step => {
        delete newSchema.properties?.[step];
      });

      return newSchema;
    }
  }

  return schema;
};

/**
 * @public
 * The component contains the react-json-schema-form and serves as an extensible form. It allows loading a custom plugin decorator to override the default react-json-schema-form properties.
 */
const OrchestratorForm = ({
  schema: rawSchema,
  updateSchema,
  handleExecute,
  isExecuting,
  initialFormData,
  setAuthTokenDescriptors,
}: OrchestratorFormProps) => {
  // make the form a controlled component so the state will remain when moving between steps. see https://rjsf-team.github.io/react-jsonschema-form/docs/quickstart#controlled-component
  const [formData, setFormData] = useState<JsonObject>(
    initialFormData ? () => structuredClone(initialFormData) : {},
  );

  const schema = useMemo(() => removeHiddenSteps(rawSchema), [rawSchema]);

  const numStepsInMultiStepSchema = useMemo(
    () => getNumSteps(schema),
    [schema],
  );
  const isMultiStep = numStepsInMultiStepSchema !== undefined;

  const _handleExecute = useCallback(() => {
    handleExecute(formData);
  }, [formData, handleExecute]);

  const onSubmit = useCallback(
    (_formData: JsonObject) => {
      setFormData(_formData);
    },
    [setFormData],
  );

  const uiSchema = useMemo<UiSchema<JsonObject>>(() => {
    return generateUiSchema(schema, isMultiStep);
  }, [schema, isMultiStep]);

  const reviewStep = useMemo(
    () => (
      <ReviewStep
        data={formData}
        schema={schema}
        busy={isExecuting}
        handleExecute={_handleExecute}
        // no schema update here
      />
    ),
    [formData, schema, isExecuting, _handleExecute],
  );

  return (
    <StepperContextProvider reviewStep={reviewStep}>
      {isMultiStep ? (
        <OrchestratorFormWrapper
          schema={schema}
          updateSchema={updateSchema}
          numStepsInMultiStepSchema={numStepsInMultiStepSchema}
          onSubmit={onSubmit}
          uiSchema={uiSchema}
          formData={formData}
          setFormData={setFormData}
          setAuthTokenDescriptors={setAuthTokenDescriptors}
        >
          <Fragment />
        </OrchestratorFormWrapper> // it is required to pass the fragment so rjsf won't generate a Submit button
      ) : (
        <SingleStepForm
          schema={schema}
          updateSchema={updateSchema}
          onSubmit={onSubmit}
          uiSchema={uiSchema}
          formData={formData}
          setFormData={setFormData}
          setAuthTokenDescriptors={setAuthTokenDescriptors}
        />
      )}
    </StepperContextProvider>
  );
};

export default OrchestratorForm;
