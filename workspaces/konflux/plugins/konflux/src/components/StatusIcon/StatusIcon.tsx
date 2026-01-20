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

import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import {
  getRunStatusModifier,
  RunStatus,
  StatusIcon as PfStatusIcon,
} from '@patternfly/react-topology';
import pipelineStyles from '@patternfly/react-topology/dist/esm/css/topology-pipelines';

import { runStatus } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Typography } from '@material-ui/core';
import { Flex, FlexItem } from '@patternfly/react-core';

type StatusIconProps = {
  status: runStatus;
  height?: number;
  width?: number;
};

export const runStatusToRunStatus = (status: runStatus): RunStatus => {
  switch (status) {
    case runStatus.Succeeded:
      return RunStatus.Succeeded;
    case runStatus.Failed:
      return RunStatus.Failed;
    case runStatus.Running:
      return RunStatus.Running;
    case runStatus['In Progress']:
      return RunStatus.InProgress;
    case runStatus.FailedToStart:
    case runStatus.PipelineNotStarted:
      return RunStatus.FailedToStart;
    case runStatus.Skipped:
      return RunStatus.Skipped;
    case runStatus.Cancelled:
    case runStatus.Cancelling:
    case runStatus.TestFailed:
    case runStatus.TestWarning:
      return RunStatus.Cancelled;
    case runStatus.Pending:
      return RunStatus.Pending;
    case runStatus.Idle:
      return RunStatus.Idle;
    default:
      return RunStatus.Pending;
  }
};

export const StatusIcon: React.FC<React.PropsWithChildren<StatusIconProps>> = ({
  status,
  ...props
}) => {
  if (status === runStatus.Cancelling) {
    // Interim state required to avoid any other actions on pipelinerun that is currently being cancelled.
    return (
      <Typography
        className={css(
          pipelineStyles.topologyPipelinesStatusIcon,
          getRunStatusModifier(RunStatus.Cancelled),
        )}
      >
        <ExclamationTriangleIcon {...props} />
      </Typography>
    );
  }
  return <PfStatusIcon status={runStatusToRunStatus(status)} {...props} />;
};

export const StatusIconWithText: React.FC<
  React.PropsWithChildren<
    StatusIconProps & { text?: string; dataTestAttribute?: string }
  >
> = ({ status, text, dataTestAttribute, ...others }) => {
  return (
    <Flex gap={{ default: 'gapXs' }}>
      <FlexItem>
        <Typography
          className={css(
            pipelineStyles.topologyPipelinesPillStatus,
            getRunStatusModifier(runStatusToRunStatus(status)),
          )}
        >
          <StatusIcon status={status} {...others} />{' '}
        </Typography>
      </FlexItem>
      <FlexItem>
        <Typography data-test={dataTestAttribute}>{text ?? status}</Typography>
      </FlexItem>
    </Flex>
  );
};
