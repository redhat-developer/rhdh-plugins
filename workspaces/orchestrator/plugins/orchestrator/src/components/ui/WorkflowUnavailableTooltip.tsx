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

import { ReactElement } from 'react';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { BUILD_WORKFLOWS_DOC_URL } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { translateMessage } from '../Trans';

type WorkflowAvailabilityDetails = NonNullable<
  WorkflowOverviewDTO['availability']
>;

type WorkflowUnavailableTooltipProps = {
  availability: WorkflowAvailabilityDetails;
  children: ReactElement;
};

const TOOLTIP_MAX_WIDTH = 359;

export const WorkflowUnavailableTooltip = ({
  availability,
  children,
}: WorkflowUnavailableTooltipProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const title = (
    <Box
      sx={{
        maxWidth: TOOLTIP_MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
        {t('workflow.unavailable.title')}
      </Typography>
      <Typography
        variant="body2"
        color="text.primary"
        sx={{ wordBreak: 'break-word' }}
      >
        {translateMessage(t, 'workflow.unavailable.requestFailed', {
          url: availability.urlToFetch ?? '',
        })}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {translateMessage(t, 'workflow.unavailable.statusCodeLine', {
          statusCode: availability.statusCode ?? '',
        })}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {translateMessage(t, 'workflow.unavailable.statusTextLine', {
          reason: availability.reason ?? '',
        })}
      </Typography>
      <MuiLink
        href={BUILD_WORKFLOWS_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
        underline="always"
        variant="body2"
        sx={{ display: 'inline-flex', alignItems: 'center', mt: 1 }}
      >
        {t('emptyState.workflows.viewDocumentation')}
        <OpenInNewIcon
          sx={{ ml: 0.5, fontSize: '1em', verticalAlign: 'text-bottom' }}
          aria-hidden
        />
      </MuiLink>
    </Box>
  );

  return (
    <Tooltip
      title={title}
      placement="right"
      arrow
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: { offset: [0, -4] },
            },
          ],
        },
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: theme.shadows[4],
            borderRadius: `${theme.shape.borderRadius * 1.5}px`,
            maxWidth: TOOLTIP_MAX_WIDTH,
            p: 2,
          },
        },
        arrow: {
          sx: {
            color: 'background.paper',
            '&::before': {
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[2],
            },
          },
        },
      }}
    >
      <Box component="span" sx={{ display: 'inline-flex', cursor: 'default' }}>
        {children}
      </Box>
    </Tooltip>
  );
};
