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

import { useEffect, useMemo, useRef, useState } from 'react';

import { ErrorPanel } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';

import Grid from '@mui/material/Grid';
import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/material-ui';
import { ErrorSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import omit from 'lodash/omit';

import {
  FormDecoratorProps,
  OrchestratorFormContextProps,
  useOrchestratorFormApiOrDefault,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import { useTranslation } from '../hooks/useTranslation';
import {
  clearExtraErrorAtPath,
  rjsfIdToFieldPath,
} from '../utils/clearExtraErrorAtPath';
import { getFieldValidationConfig } from '../utils/fieldValidationConfig';
import { getActiveStepKey } from '../utils/getSortedStepEntries';
import { normalizeErrorSchema } from '../utils/resolveStepErrorSchema';
import { useStepperContext } from '../utils/StepperContext';
import { toRootExtraErrors } from '../utils/toRootExtraErrors';
import { useFieldValidation } from '../utils/useFieldValidation';
import useValidator from '../utils/useValidator';
import { AuthRequester } from './AuthRequester';
import HiddenObjectFieldTemplate from './HiddenObjectFieldTemplate';
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
  const {
    handleNext,
    activeStep,
    handleValidateStarted,
    handleValidateEnded,
    clearFormErrorsRef,
  } = useStepperContext();
  const [validationError, setValidationError] = useState<Error | undefined>();
  const validator = useValidator(isMultiStep);
  const { t } = useTranslation();

  const formDataRef = useRef<JsonObject>(formContext?.formData ?? {});
  useEffect(() => {
    formDataRef.current = formContext?.formData ?? {};
  }, [formContext?.formData]);

  const { validatingFields, triggerFieldValidation } = useFieldValidation({
    uiSchema: formContext?.uiSchema ?? {},
    getExtraErrorsForField: decoratorProps.getExtraErrorsForField,
    setExtraErrors,
    formDataRef,
  });

  const enhancedFormContext = useMemo(
    () => (formContext ? { ...formContext, validatingFields } : formContext),
    [formContext, validatingFields],
  );

  useEffect(() => {
    clearFormErrorsRef.current = () => {
      setExtraErrors(undefined);
      setValidationError(undefined);
    };
    return () => {
      clearFormErrorsRef.current = undefined;
    };
  }, [clearFormErrorsRef]);

  if (!formContext) {
    return <div>{t('formDecorator.error')}</div>;
  }

  const { onSubmit: _onSubmit, children, setFormData } = formContext;

  const getActiveKey = () => {
    if (!isMultiStep) {
      return undefined;
    }

    return getActiveStepKey(
      formContext.schema,
      activeStep,
      formContext.formData,
    );
  };

  const onSubmit = async (_formData: JsonObject) => {
    setExtraErrors(undefined);
    let _extraErrors: ErrorSchema<JsonObject> | undefined = undefined;
    let _validationError: Error | undefined = undefined;
    const activeKey = getActiveKey();
    const { uiSchema: currentUiSchema } = formContext;
    const shouldScopeExtraErrors =
      Boolean(activeKey) && Boolean(currentUiSchema?.[activeKey as string]);
    const extraErrorsFormData = (_formData ??
      formContext.formData) as JsonObject;
    const extraErrorsUiSchema = shouldScopeExtraErrors
      ? ({
          [activeKey as string]: currentUiSchema?.[activeKey as string],
        } as OrchestratorFormContextProps['uiSchema'])
      : currentUiSchema;

    if (decoratorProps.getExtraErrors) {
      try {
        handleValidateStarted();
        _extraErrors = await decoratorProps.getExtraErrors(
          extraErrorsFormData,
          extraErrorsUiSchema,
        );

        setExtraErrors(
          normalizeErrorSchema(toRootExtraErrors(activeKey, _extraErrors)),
        );
      } catch (err) {
        _validationError = err as Error;
      } finally {
        handleValidateEnded();
      }
    }
    setValidationError(_validationError);

    const currentStepErrors = activeKey
      ? _extraErrors?.[activeKey]
      : _extraErrors;
    const hasCurrentStepErrors =
      currentStepErrors && Object.keys(currentStepErrors).length > 0;

    if (
      !hasCurrentStepErrors &&
      !_validationError &&
      activeStep < (numStepsInMultiStepSchema ?? 1)
    ) {
      _onSubmit(_formData);
      handleNext();
    }
  };

  const onBlur = (id: string, _value: unknown) => {
    const fieldPath = rjsfIdToFieldPath(id);
    if (fieldPath) {
      triggerFieldValidation(fieldPath, 'blur');
    }
  };

  const onChange = (
    e: IChangeEvent<JsonObject, JSONSchema7, OrchestratorFormContextProps>,
    id?: string,
  ) => {
    const fieldPath = rjsfIdToFieldPath(id);
    const hasChangeValidation =
      fieldPath &&
      getFieldValidationConfig(
        formContext.uiSchema,
        fieldPath,
      )?.validateOn.includes('change');
    if (!hasChangeValidation) {
      setExtraErrors(prev => clearExtraErrorAtPath(prev, fieldPath));
    }
    setValidationError(undefined);
    const latestFormData = e.formData || {};
    formDataRef.current = latestFormData;
    setFormData(latestFormData);
    if (decoratorProps.onChange) {
      decoratorProps.onChange(e, id);
    }
    if (fieldPath) {
      triggerFieldValidation(fieldPath, 'change');
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
          {...omit(decoratorProps, 'getExtraErrors', 'getExtraErrorsForField')}
          widgets={{ AuthRequester, ...decoratorProps.widgets }}
          fields={isMultiStep ? { ObjectField: StepperObjectField } : {}}
          templates={{
            ObjectFieldTemplate: HiddenObjectFieldTemplate,
          }}
          uiSchema={formContext.uiSchema}
          validator={validator}
          schema={formContext.schema}
          formData={formContext.formData}
          formContext={enhancedFormContext}
          noHtml5Validate
          extraErrors={normalizeErrorSchema(extraErrors)}
          onSubmit={e => onSubmit(e.formData || {})}
          onChange={onChange}
          onBlur={onBlur}
        >
          {children}
        </MuiForm>
      </Grid>
    </Grid>
  );
};

const OrchestratorFormWrapper = (props: OrchestratorFormContextProps) => {
  const formApi = useOrchestratorFormApiOrDefault();
  const { handleFetchStarted, handleFetchEnded } = useStepperContext();

  const NewComponent = useMemo(() => {
    const formDecorator = formApi.getFormDecorator();
    return formDecorator(FormComponent);
  }, [formApi]);

  const propsWithFetchHandlers = useMemo(
    () => ({
      ...props,
      handleFetchStarted,
      handleFetchEnded,
    }),
    [props, handleFetchStarted, handleFetchEnded],
  );

  return <NewComponent {...propsWithFetchHandlers} />;
};

export default OrchestratorFormWrapper;
