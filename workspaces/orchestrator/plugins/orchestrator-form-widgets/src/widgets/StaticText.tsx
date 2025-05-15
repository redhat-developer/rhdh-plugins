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
import Typography from '@material-ui/core/Typography';

import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import { FormContextData } from '../types';
import { UiProps } from '../uiPropTypes';
import { CircularProgress } from '@material-ui/core';
import { ErrorText } from './ErrorText';
import { useWrapperFormPropsContext } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { useFetchAndEvaluate } from '../utils';

const StaticText: Widget<JsonObject, JSONSchema7, FormContextData> = props => {
  const { id, options } = props;
  const uiProps = (options?.props ?? {}) as UiProps;

  const formContext = useWrapperFormPropsContext();
  const formData = formContext.formData;
  const { text, error, loading } = useFetchAndEvaluate(formData, uiProps, id);
  if (error) {
    return <ErrorText text={error} />;
  }
  return (
    <Typography variant={uiProps['ui:variant']}>
      {loading ? <CircularProgress size={20} /> : text}
    </Typography>
  );
};

export default StaticText;
