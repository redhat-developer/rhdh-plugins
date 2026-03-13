/**
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

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import {
  Module,
  ModuleStatus,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Tooltip, Box, makeStyles, Chip } from '@material-ui/core';
import {
  StatusError,
  StatusOK,
  StatusPending,
  StatusRunning,
} from '@backstage/core-components';

import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  toReviewChip: {
    marginLeft: theme.spacing(1),
    marginBottom: 0,
  },
  unknownStatus: {
    fontWeight: theme.typography.fontWeightMedium as any,
    display: 'flex',
    alignItems: 'baseline',
  },
  unknownStatusIcon: {
    flexShrink: 0,
    position: 'relative',
    top: '0.125em',
    marginRight: theme.spacing(1),
    width: '0.8em',
    height: '0.8em',
  },
}));

const StatusWithText = ({
  status,
  children,
}: {
  status?: ModuleStatus;
  children?: React.ReactNode;
}) => {
  const classes = useStyles();
  switch (status) {
    case 'success':
      return <StatusOK>{children}</StatusOK>;
    case 'error':
      return <StatusError>{children}</StatusError>;
    case 'running':
      return <StatusRunning>{children}</StatusRunning>;
    case 'pending':
      return <StatusPending>{children}</StatusPending>;
    default:
      return (
        <Box component="span" className={classes.unknownStatus}>
          <HelpOutlineIcon
            color="disabled"
            className={classes.unknownStatusIcon}
          />
          {children}
        </Box>
      );
  }
};

export const ModuleStatusCell = ({ module }: { module?: Module }) => {
  const { t } = useTranslation();
  const styles = useStyles();

  let chip;
  if (module?.status === 'success') {
    if (module.publish) {
      chip = (
        <Chip
          label={t('projectModulesCard.published')}
          size="small"
          variant="outlined"
          color="primary"
          className={styles.toReviewChip}
        />
      );
    } else {
      chip = (
        <Chip
          label={t('projectModulesCard.toReview')}
          size="small"
          variant="outlined"
          color="primary"
          className={styles.toReviewChip}
        />
      );
    }
  }

  const status = module?.status;
  const statusText = t(`module.statuses.${status || 'none'}`);
  const content = (
    <Box display="flex" flexWrap="wrap" alignItems="center">
      <Box whiteSpace="nowrap">
        <StatusWithText status={status}>{statusText}</StatusWithText>
      </Box>
      {chip}
    </Box>
  );

  if (module?.errorDetails) {
    return (
      <Tooltip title={module.errorDetails}>
        <div>{content}</div>
      </Tooltip>
    );
  }

  return <div>{content}</div>;
};
