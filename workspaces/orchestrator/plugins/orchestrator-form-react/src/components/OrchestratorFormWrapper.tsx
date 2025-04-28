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

import { ErrorPanel } from '@backstage/core-components';
import { useApiHolder } from '@backstage/core-plugin-api';
import { JsonObject } from '@backstage/types';

import { Grid } from '@material-ui/core';
import { withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/material-ui';
import { ErrorSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import omit from 'lodash/omit';

import {
  FormDecoratorProps,
  orchestratorFormApiRef,
  OrchestratorFormContextProps,
  useWrapperFormPropsContext,
  WrapperFormPropsContext,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import { defaultFormExtensionsApi } from '../DefaultFormApi';
import { useStepperContext } from '../utils/StepperContext';
import useValidator from '../utils/useValidator';
import StepperObjectField from './StepperObjectField';

const MuiForm = withTheme<JsonObject, JSONSchema7>(MuiTheme);

const FormComponent = (decoratorProps: FormDecoratorProps) => {
  const formContext = useWrapperFormPropsContext();

  const {
    numStepsInMultiStepSchema,
    uiSchema,
    schema,
    onSubmit: _onSubmit,
    children,
    formData,
    setFormData,
  } = formContext;
  const [extraErrors, setExtraErrors] = React.useState<
    ErrorSchema<JsonObject> | undefined
  >();
  const isMultiStep = numStepsInMultiStepSchema !== undefined;
  const { handleNext, activeStep, handleValidateStarted, handleValidateEnded } =
    useStepperContext();
  const [validationError, setValidationError] = React.useState<
    Error | undefined
  >();
  const validator = useValidator(isMultiStep);
  const getActiveKey = () => {
    if (!isMultiStep) {
      return undefined;
    }
    return Object.keys(schema.properties || {})[activeStep];
  };

  const onSubmit = async (_formData: JsonObject) => {
    setExtraErrors(undefined);
    let _extraErrors: ErrorSchema<JsonObject> | undefined = undefined;
    let _validationError: Error | undefined = undefined;
    if (decoratorProps.getExtraErrors) {
      try {
        handleValidateStarted();
        _extraErrors = await decoratorProps.getExtraErrors(formData);
        const activeKey = getActiveKey();
        setExtraErrors(
          activeKey && _extraErrors?.[activeKey]
            ? (_extraErrors[activeKey] as ErrorSchema<JsonObject>)
            : _extraErrors,
        );
      } catch (err) {
        _validationError = err as Error;
      } finally {
        handleValidateEnded();
      }
    }
    setValidationError(_validationError);
    if (
      (!_extraErrors || Object.keys(_extraErrors).length === 0) &&
      !_validationError &&
      activeStep < (numStepsInMultiStepSchema ?? 1)
    ) {
      _onSubmit(_formData);
      handleNext();
    }
  };

  return (
    <Grid container spacing={2} direction="column" wrap="nowrap">
      {validationError && (
        <Grid item>
          <ErrorPanel error={validationError} />
        </Grid>
      )}
      <Grid item>
        <MuiForm
          {...omit(decoratorProps, 'getExtraErrors')}
          fields={isMultiStep ? { ObjectField: StepperObjectField } : {}}
          uiSchema={uiSchema}
          validator={validator}
          schema={schema}
          formData={formData}
          noHtml5Validate
          extraErrors={extraErrors}
          onSubmit={e => onSubmit(e.formData || {})}
          onChange={e => {
            setFormData(e.formData || {});
            if (decoratorProps.onChange) {
              decoratorProps.onChange(e);
            }
          }}
        >
          {children}
        </MuiForm>
      </Grid>
    </Grid>
  );
};

type OrchestratorFormWrapperProps = OrchestratorFormContextProps;

const OrchestratorFormWrapper = (props: OrchestratorFormWrapperProps) => {
  const formApi =
    useApiHolder().get(orchestratorFormApiRef) || defaultFormExtensionsApi;

  const NewComponent = React.useMemo(() => {
    const formDecorator = formApi.getFormDecorator();
    return formDecorator(FormComponent);
  }, [formApi]);

  return (
    <WrapperFormPropsContext.Provider value={props}>
      <NewComponent />
    </WrapperFormPropsContext.Provider>
  );
};

export default OrchestratorFormWrapper;
