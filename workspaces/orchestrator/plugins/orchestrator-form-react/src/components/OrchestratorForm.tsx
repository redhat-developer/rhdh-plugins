/*
 * Copyright 2024 The Backstage Authors
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

import generateUiSchema from '../utils/generateUiSchema';
import { StepperContextProvider } from '../utils/StepperContext';
import OrchestratorFormStepper, {
  OrchestratorFormStep,
  OrchestratorFormToolbar,
} from './OrchestratorFormStepper';
import OrchestratorFormWrapper from './OrchestratorFormWrapper';
import ReviewStep from './ReviewStep';

const getNumSteps = (schema: JSONSchema7): number | undefined => {
  if (schema.type !== 'object' || !schema.properties) return undefined;
  const isMultiStep = Object.values(schema.properties).every(
    prop => (prop as JSONSchema7).type === 'object',
  );
  return isMultiStep ? Object.keys(schema.properties).length : undefined;
};

const SingleStepForm = ({
  schema,
  initialFormData,
  onSubmit,
  uiSchema,
}: {
  schema: JSONSchema7;
  initialFormData?: JsonObject;
  onSubmit: (formData: JsonObject) => void;
  uiSchema: UiSchema<JsonObject>;
}) => {
  const [_initialFormData, setInitialFormData] = React.useState<
    JsonObject | undefined
  >(initialFormData);

  const _onSubmit = React.useCallback(
    (formData: JsonObject) => {
      // Since the review step is outside of the MuiForm component in SingleStepForm, we need to load the current values when navigating back.
      setInitialFormData(formData);
      onSubmit(formData);
    },
    [onSubmit, setInitialFormData],
  );

  const steps = React.useMemo<OrchestratorFormStep[]>(() => {
    return [
      {
        title: schema.title || 'Inputs',
        key: 'schema',
        content: (
          <OrchestratorFormWrapper
            schema={{ ...schema, title: '' }}
            initialFormData={_initialFormData}
            onSubmit={_onSubmit}
            uiSchema={uiSchema}
          >
            <OrchestratorFormToolbar />
          </OrchestratorFormWrapper>
        ),
      },
    ];
  }, [schema, _initialFormData, uiSchema, _onSubmit]);
  return <OrchestratorFormStepper steps={steps} />;
};

/**
 * @public
 * OrchestratorForm component properties
 */
export type OrchestratorFormProps = {
  schema: JSONSchema7;
  isExecuting: boolean;
  handleExecute: (parameters: JsonObject) => Promise<void>;
  data?: JsonObject;
  isDataReadonly?: boolean;
};

/**
 * @public
 * The component contains the react-json-schema-form and serves as an extensible form. It allows loading a custom plugin decorator to override the default react-json-schema-form properties.
 */
const OrchestratorForm = ({
  schema,
  handleExecute,
  isExecuting,
  data,
  isDataReadonly,
}: OrchestratorFormProps) => {
  const [formData, setFormData] = React.useState<JsonObject>(data || {});
  const numStepsInMultiStepSchema = React.useMemo(
    () => getNumSteps(schema),
    [schema],
  );
  const isMultiStep = numStepsInMultiStepSchema !== undefined;

  const _handleExecute = React.useCallback(() => {
    handleExecute(formData || {});
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
      isDataReadonly ? data : undefined,
    );
  }, [schema, isMultiStep, isDataReadonly, data]);

  const reviewStep = React.useMemo(
    () => (
      <ReviewStep
        data={formData || {}}
        schema={schema}
        busy={isExecuting}
        handleExecute={_handleExecute}
      />
    ),
    [formData, schema, isExecuting, _handleExecute],
  );

  return (
    <StepperContextProvider reviewStep={reviewStep}>
      {isMultiStep ? (
        <OrchestratorFormWrapper
          schema={schema}
          numStepsInMultiStepSchema={numStepsInMultiStepSchema}
          onSubmit={onSubmit}
          uiSchema={uiSchema}
          initialFormData={data}
        >
          <Fragment />
        </OrchestratorFormWrapper> // it is required to pass the fragment so rjsf won't generate a Submit button
      ) : (
        <SingleStepForm
          schema={schema}
          onSubmit={onSubmit}
          initialFormData={data}
          uiSchema={uiSchema}
        />
      )}
    </StepperContextProvider>
  );
};

export default OrchestratorForm;
