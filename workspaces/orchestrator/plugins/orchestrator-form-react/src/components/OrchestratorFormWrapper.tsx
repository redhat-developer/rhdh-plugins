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

import { useMemo, useState } from 'react';

import { ErrorPanel } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';

import Grid from '@mui/material/Grid';
import { withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/material-ui';
import { ErrorSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import omit from 'lodash/omit';

import {
  FormDecoratorProps,
  OrchestratorFormContextProps,
  useOrchestratorFormApiOrDefault,
} from '@redhat/backstage-plugin-orchestrator-form-api';

import { useTranslation } from '../hooks/useTranslation';
import { getActiveStepKey } from '../utils/getSortedStepEntries';
import { useStepperContext } from '../utils/StepperContext';
import useValidator from '../utils/useValidator';
import { AuthRequester } from './AuthRequester';
import StepperObjectField from './StepperObjectField';

const MuiForm = withTheme<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
>(MuiTheme);

const FormComponent = (decoratorProps: FormDecoratorProps) => {
  const formContext = decoratorProps.formContext;

  const [extraErrors, setExtraErrors] = useState<
    ErrorSchema<JsonObject> | undefined
  >();
  const numStepsInMultiStepSchema = formContext?.numStepsInMultiStepSchema;
  const isMultiStep = numStepsInMultiStepSchema !== undefined;
  const { handleNext, activeStep, handleValidateStarted, handleValidateEnded } =
    useStepperContext();
  const [validationError, setValidationError] = useState<Error | undefined>();
  const validator = useValidator(isMultiStep);
  const { t } = useTranslation();

  if (!formContext) {
    return <div>{t('formDecorator.error')}</div>;
  }

  const {
    uiSchema,
    schema,
    onSubmit: _onSubmit,
    children,
    formData,
    setFormData,
  } = formContext;

  const getActiveKey = () => {
    if (!isMultiStep) {
      return undefined;
    }

    return getActiveStepKey(schema, activeStep);
  };

  const onSubmit = async (_formData: JsonObject) => {
    setExtraErrors(undefined);
    let _extraErrors: ErrorSchema<JsonObject> | undefined = undefined;
    let _validationError: Error | undefined = undefined;
    if (decoratorProps.getExtraErrors) {
      try {
        handleValidateStarted();
        _extraErrors = await decoratorProps.getExtraErrors(formData, uiSchema);
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
          widgets={{ AuthRequester, ...decoratorProps.widgets }}
          fields={isMultiStep ? { ObjectField: StepperObjectField } : {}}
          uiSchema={uiSchema}
          validator={validator}
          schema={schema}
          formData={formData}
          formContext={formContext}
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

const OrchestratorFormWrapper = (props: OrchestratorFormContextProps) => {
  const formApi = useOrchestratorFormApiOrDefault();

  const NewComponent = useMemo(() => {
    const formDecorator = formApi.getFormDecorator();
    return formDecorator(FormComponent);
  }, [formApi]);

  return <NewComponent {...props} />;
};

export default OrchestratorFormWrapper;
