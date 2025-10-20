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

import { MarkdownContent } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import { UiProps } from '../uiPropTypes';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { ErrorText } from './ErrorText';
import { OrchestratorFormContextProps } from '@redhat/backstage-plugin-orchestrator-form-api';
import { useFetchAndEvaluate } from '../utils';

export const ActiveText: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const { id, options, formContext } = props;
  const uiProps = (options?.props ?? {}) as UiProps;

  const formData = formContext?.formData;

  const { text, error, loading } = useFetchAndEvaluate(
    uiProps['ui:text'] ?? '',
    formData ?? {},
    uiProps,
    id,
  );

  if (!uiProps['ui:text']) {
    return (
      <ErrorText
        id={id}
        text={`Field ${id} is configured to use ActiveText widget, but doesn't contain property ui:text.`}
      />
    );
  }

  if (error) {
    return <ErrorText id={id} text={error} />;
  }

  return (
    <Box data-testid={id}>
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <MarkdownContent content={text || ''} />
      )}
    </Box>
  );
};
