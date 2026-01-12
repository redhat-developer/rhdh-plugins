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

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';

import { AVAILABLE, UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';

const useStyles = makeStyles()(theme => ({
  warning: {
    color: theme.palette.warning.main,
  },
  success: {
    color: theme.palette.success.main,
  },
}));

export const WorkflowStatus = ({
  availability,
}: {
  availability: string | undefined | boolean;
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  if (availability === AVAILABLE || availability === true) {
    return (
      <Box display="flex" alignItems="center">
        <CheckCircleOutlined className={classes.success} />
        &nbsp; {t('workflow.status.available')}
      </Box>
    );
  } else if (availability === UNAVAILABLE || availability === false) {
    return (
      <Tooltip title={t('tooltips.workflowDown')}>
        <Box display="flex" alignItems="center">
          <WarningAmberOutlined className={classes.warning} />
          &nbsp; {t('workflow.status.unavailable')}
        </Box>
      </Tooltip>
    );
  }

  return <>{availability}</>;
};
