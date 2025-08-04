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

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  capitalize,
  WorkflowDataDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { useIsDarkMode } from '../../utils/isDarkMode';
import { InfoDialog } from '../InfoDialog';
import { JsonCodeBlock } from '../ui/JsonCodeBlock';

export const VariablesDialog = ({
  open,
  onClose,
  instanceVariables,
}: {
  open: boolean;
  onClose: () => void;
  instanceVariables: WorkflowDataDTO;
}) => {
  const isDarkMode = useIsDarkMode();
  const hasVariables = Object.keys(instanceVariables).length > 0;

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
      {hasVariables ? (
        Object.entries(instanceVariables).map(([key, value]) => (
          <Box key={key} m={2}>
            <Typography variant="h6" mb={1}>
              {capitalize(key)}
            </Typography>
            <JsonCodeBlock isDarkMode={isDarkMode} value={value} />
          </Box>
        ))
      ) : (
        <Typography>No variables found for this run.</Typography>
      )}
    </InfoDialog>
  );
};
