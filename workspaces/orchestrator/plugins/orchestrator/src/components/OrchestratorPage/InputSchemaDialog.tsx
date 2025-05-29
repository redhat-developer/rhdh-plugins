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
import { useAsync } from 'react-use';
import useObservable from 'react-use/esm/useObservable';

import {
  CodeSnippet,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { appThemeApiRef, useApi } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { InputSchemaResponseDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api/api';
import { FormattedWorkflowOverview } from '../../dataFormatters/WorkflowOverviewFormatter';
import { InfoDialog } from '../InfoDialog';

const InputSchemaDialogContent = ({
  inputSchema,
  loading,
  error,
}: {
  inputSchema: InputSchemaResponseDTO | undefined;
  loading: boolean;
  error: Error | undefined;
}) => {
  const appThemeApi = useApi(appThemeApiRef);
  const activeThemeId = useObservable(
    appThemeApi.activeThemeId$(),
    appThemeApi.getActiveThemeId(),
  );
  const theme = useTheme();

  if (loading) return <Progress />;
  if (error)
    return (
      <div style={{ width: '500px' }}>
        <ResponseErrorPanel error={error} />
      </div>
    );

  return (
    <Box>
      {inputSchema?.inputSchema === undefined ? (
        'No input schema is defined for this workflow'
      ) : (
        <CodeSnippet
          text={JSON.stringify(inputSchema, null, 2)}
          language="json"
          showLineNumbers
          showCopyCodeButton
          customStyle={{
            color:
              activeThemeId === 'dark'
                ? theme.palette.grey[100]
                : theme.palette.grey[800],
            backgroundColor:
              activeThemeId === 'dark'
                ? theme.palette.grey[900]
                : theme.palette.grey[100],
            padding: '25px 0',
          }}
        />
      )}
    </Box>
  );
};

export const InputSchemaDialog: React.FC<{
  rowData: FormattedWorkflowOverview;
  isInputSchemaDialogOpen: boolean;
  toggleInputSchemaDialog: () => void;
}> = ({ rowData, isInputSchemaDialogOpen, toggleInputSchemaDialog }) => {
  const orchestratorApi = useApi(orchestratorApiRef);

  const {
    value,
    loading,
    error: responseError,
  } = useAsync(async (): Promise<InputSchemaResponseDTO> => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(rowData.id);

    return res.data;
  }, [orchestratorApi, rowData]);

  return (
    <InfoDialog
      title={`${rowData.name} input schema`}
      onClose={toggleInputSchemaDialog}
      open={isInputSchemaDialogOpen}
      dialogActions={
        <Button
          color="primary"
          variant="contained"
          onClick={toggleInputSchemaDialog}
        >
          Close
        </Button>
      }
      children={
        <InputSchemaDialogContent
          inputSchema={value}
          loading={loading}
          error={responseError}
        />
      }
      wideDialog
    />
  );
};
