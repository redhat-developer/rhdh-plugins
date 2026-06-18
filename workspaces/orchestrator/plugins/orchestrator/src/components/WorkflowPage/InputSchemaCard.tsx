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

import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { JsonCodeBlock } from '../ui/JsonCodeBlock';

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (theme, { isDarkMode }) => ({
    headerIcon: {
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[700],
    },
  }),
);

export const InputSchemaCard = ({ workflowId }: { workflowId: string }) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });
  const orchestratorApi = useApi(orchestratorApiRef);

  const { value, loading, error } = useAsync(async () => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(workflowId);
    return res.data;
  }, [orchestratorApi, workflowId]);

  const title = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography
        component="span"
        variant="inherit"
        sx={{ fontWeight: 'bold' }}
      >
        {t('workflow.inputSchema')}
      </Typography>
      <Tooltip title={t('workflow.inputSchemaDescription')}>
        <IconButton
          size="large"
          aria-label={t('workflow.inputSchemaDescription')}
          sx={{ mr: '8px', p: 0.5 }}
        >
          <InfoOutlined fontSize="small" className={classes.headerIcon} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <InfoCard
        title={title}
        titleTypographyProps={{ component: 'div', style: { width: '100%' } }}
      >
        {loading && <Progress />}
        {error && <ResponseErrorPanel error={error} />}
        {!loading && !error && value?.inputSchema === undefined ? (
          <Typography>{t('messages.noInputSchemaWorkflow')}</Typography>
        ) : null}
        {!loading && !error && value?.inputSchema !== undefined ? (
          <JsonCodeBlock
            isDarkMode={isDarkMode}
            value={value.inputSchema}
            fullWidth
          />
        ) : null}
      </InfoCard>
    </Box>
  );
};
