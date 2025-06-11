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

import { CodeSnippet } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  capitalize,
  WorkflowDataDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { InfoDialog } from '../InfoDialog';

export const VariablesDialog = ({
  open,
  onClose,
  instanceVariables,
}: {
  open: boolean;
  onClose: () => void;
  instanceVariables: WorkflowDataDTO;
}) => {
  return (
    <InfoDialog
      title="Run Variables"
      onClose={onClose}
      open={open}
      dialogActions={
        <Button color="primary" variant="contained" onClick={onClose}>
          Close
        </Button>
      }
      wideDialog
    >
      <Box>
        {Object.entries(instanceVariables).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <Typography variant="h6" style={{ marginBottom: '8px' }}>
              {capitalize(key)}
            </Typography>
            <CodeSnippet
              text={JSON.stringify(value, null, 2)}
              language="json"
              showLineNumbers
              showCopyCodeButton
              customStyle={{
                padding: '25px 0',
              }}
            />
          </div>
        ))}
      </Box>
    </InfoDialog>
  );
};
