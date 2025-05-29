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

import type { JsonObject } from '@backstage/types';

import Editor, { loader } from '@monaco-editor/react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

import { SubmitButton } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';

import { useIsDarkMode } from '../../utils/isDarkMode';

loader.config({
  // FLPATH-2358: If production env keeps downloading from jsdelivr.net, configure local path here
});

const DEFAULT_VALUE = JSON.stringify({ myKey: 'myValue' }, null, 4);

const JsonTextAreaForm = ({
  isExecuting,
  handleExecute,
}: {
  isExecuting: boolean;
  handleExecute: (parameters: JsonObject) => Promise<void>;
}) => {
  const [jsonText, setJsonText] = React.useState(DEFAULT_VALUE);
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();

  const getParameters = (): JsonObject => {
    if (!jsonText) {
      return {};
    }
    const parameters = JSON.parse(jsonText);
    return parameters as JsonObject;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" style={{ width: '100%' }}>
          <AlertTitle>Missing JSON Schema for Input Form.</AlertTitle>
          Type the input data in JSON format below.
          <br />
          If you prefer using a form to start the workflow, ensure a valid JSON
          schema is provided in the 'dataInputSchema' property of your workflow
          definition file.
        </Alert>
      </Grid>
      <Grid item xs={12}>
        <Box style={{ border: `1px solid ${theme.palette.border}` }}>
          <Editor
            value={jsonText}
            language="json"
            onChange={(value: string | undefined) => setJsonText(value ?? '')}
            height="30rem"
            theme={isDarkMode ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
            }}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <SubmitButton
          submitting={isExecuting}
          handleClick={() => handleExecute(getParameters())}
        >
          Run
        </SubmitButton>
      </Grid>
    </Grid>
  );
};

export default JsonTextAreaForm;
