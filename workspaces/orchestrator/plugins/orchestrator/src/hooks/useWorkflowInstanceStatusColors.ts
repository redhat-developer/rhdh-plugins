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

import { makeStyles } from 'tss-react/mui';

import { ProcessInstanceStatusDTO } from '@redhat/backstage-plugin-orchestrator-common';

const useStyles = makeStyles()(
  theme =>
    ({
      [ProcessInstanceStatusDTO.Active]: {
        color: theme.palette.grey[500],
      },
      [ProcessInstanceStatusDTO.Completed]: {
        color: theme.palette.success.main,
      },
      [ProcessInstanceStatusDTO.Suspended]: {
        color: theme.palette.grey[500],
      },
      [ProcessInstanceStatusDTO.Aborted]: {
        color: theme.palette.grey[500],
      },
      [ProcessInstanceStatusDTO.Error]: {
        color: theme.palette.error.main,
      },
      [ProcessInstanceStatusDTO.Pending]: {
        color: theme.palette.grey[500],
      },
    }) as const,
);

export const useWorkflowInstanceStateColors = (
  value?: ProcessInstanceStatusDTO,
) => {
  const { classes } = useStyles();
  return value ? classes[value] : undefined;
};
