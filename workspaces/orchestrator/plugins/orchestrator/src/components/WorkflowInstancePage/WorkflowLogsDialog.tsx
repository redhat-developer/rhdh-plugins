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

import { useCallback, useEffect, useState } from 'react';

import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { WorkflowLogEntry } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { InfoDialog } from '../ui/InfoDialog';
import { TextCodeBlock } from '../ui/TextCodeBlock';

export interface WorkflowLogsDialogProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
}

export const WorkflowLogsDialog = ({
  open,
  onClose,
  instanceId,
}: WorkflowLogsDialogProps) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const orchestratorApi = useApi(orchestratorApiRef);

  const [logs, setLogs] = useState<WorkflowLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!open || !instanceId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await orchestratorApi.getInstanceLogs(instanceId);
      setLogs(response.data.logs || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [open, instanceId, orchestratorApi]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const renderContent = () => {
    if (loading) {
      return <Progress />;
    }

    if (error) {
      return (
        <div style={{ width: '500px' }}>
          <ResponseErrorPanel error={error} />
        </div>
      );
    }

    if (logs.length === 0) {
      return <Typography>{t('run.logs.noLogsAvailable')}</Typography>;
    }

    const logsText = logs.map(entry => entry.log).join('\n\n');

    return (
      <Box>
        <TextCodeBlock
          isDarkMode={isDarkMode}
          maxHeight={400}
          value={logsText}
        />
      </Box>
    );
  };

  return (
    <InfoDialog
      title={t('run.logs.title')}
      onClose={onClose}
      open={open}
      dialogActions={
        <Button color="primary" variant="contained" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
      wideDialog
    >
      {renderContent()}
    </InfoDialog>
  );
};
