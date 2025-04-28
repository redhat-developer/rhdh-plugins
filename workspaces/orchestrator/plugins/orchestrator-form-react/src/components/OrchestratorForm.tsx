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

import React, { Fragment } from 'react';

import { JsonObject } from '@backstage/types';

import { UiSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

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
  isExecuting: boolean;
  handleExecute: (parameters: JsonObject) => Promise<void>;
  initialFormData: JsonObject;
  isDataReadonly?: boolean;
};

/**
 * @public
 * The component contains the react-json-schema-form and serves as an extensible form. It allows loading a custom plugin decorator to override the default react-json-schema-form properties.
 */
const OrchestratorForm = ({
  schema,
  updateSchema,
  handleExecute,
  isExecuting,
  initialFormData,
  isDataReadonly,
}: OrchestratorFormProps) => {
  // make the form a controlled component so the state will remain when moving between steps. see https://rjsf-team.github.io/react-jsonschema-form/docs/quickstart#controlled-component
  const [formData, setFormData] = React.useState<JsonObject>(
    initialFormData ? () => structuredClone(initialFormData) : {},
  );

  const numStepsInMultiStepSchema = React.useMemo(
    () => getNumSteps(schema),
    [schema],
  );
  const isMultiStep = numStepsInMultiStepSchema !== undefined;

  const _handleExecute = React.useCallback(() => {
    handleExecute(formData);
  }, [formData, handleExecute]);

  const onSubmit = React.useCallback(
    (_formData: JsonObject) => {
      setFormData(_formData);
    },
    [setFormData],
  );

  const uiSchema = React.useMemo<UiSchema<JsonObject>>(() => {
    return generateUiSchema(
      schema,
      isMultiStep,
      isDataReadonly ? initialFormData : undefined,
    );
  }, [schema, isMultiStep, isDataReadonly, initialFormData]);

  const reviewStep = React.useMemo(
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
        />
      )}
    </StepperContextProvider>
  );
};

export default OrchestratorForm;
