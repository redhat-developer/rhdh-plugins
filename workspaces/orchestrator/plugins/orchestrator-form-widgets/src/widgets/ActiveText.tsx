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
import Typography from '@mui/material/Typography';
import { ErrorText } from './ErrorText';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { useFetchAndEvaluate } from '../utils';

export const ActiveText: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const { id, options, formContext } = props;
  const uiProps = (options?.props ?? {}) as UiProps;

  const formData = formContext?.formData;
  const handleFetchStarted = formContext?.handleFetchStarted;
  const handleFetchEnded = formContext?.handleFetchEnded;

  const { text, error, loading, waitingForRetrigger } = useFetchAndEvaluate(
    uiProps['ui:text'] ?? '',
    formData ?? {},
    uiProps,
    id,
    handleFetchStarted,
    handleFetchEnded,
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

  let content: React.ReactNode;
  if (waitingForRetrigger) {
    content = (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="textSecondary">
          Waiting for dependency values to resolve.
        </Typography>
      </Box>
    );
  } else if (loading) {
    content = <CircularProgress size={20} />;
  } else {
    content = <MarkdownContent content={text || ''} />;
  }

  return <Box data-testid={id}>{content}</Box>;
};
