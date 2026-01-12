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

import { useAsync } from 'react-use';

import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { InputSchemaResponseDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api/api';
import { FormattedWorkflowOverview } from '../../dataFormatters/WorkflowOverviewFormatter';
import { useTranslation } from '../../hooks/useTranslation';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { InfoDialog } from '../ui/InfoDialog';
import { JsonCodeBlock } from '../ui/JsonCodeBlock';

const InputSchemaDialogContent = ({
  inputSchema,
  loading,
  error,
}: {
  inputSchema: InputSchemaResponseDTO | undefined;
  loading: boolean;
  error: Error | undefined;
}) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

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
        <Typography>{t('messages.noInputSchemaWorkflow')}</Typography>
      ) : (
        <JsonCodeBlock
          isDarkMode={isDarkMode}
          maxHeight={400}
          value={inputSchema?.inputSchema}
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
