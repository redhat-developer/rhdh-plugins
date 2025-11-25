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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import { TableCell, TableRow } from '@material-ui/core';
import { SubcommponentLinkTableCell } from '../../Table/SubcomponentLinkTableCell';
import {
  getApplicationFromResource,
  PipelineRunLabel,
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { Timestamp } from '../../Timestamp/Timestamp';
import { Flex } from '@patternfly/react-core';
import { TriggerColumnData } from './TriggerColumnData';
import {
  calculateDuration,
  PipelineRunEventTypeLabel,
  pipelineRunStatus,
} from '../../../utils/pipeline-runs';
import { createCommitObjectFromPLR } from '../../../utils/commits';

import { ExternalLink } from '../../ExternalLink';
import { getPipelineRunOverviewPath } from '../../../utils/url-paths';

type Props = {
  pipelineRun: PipelineRunResource;
  hasSubcomponents: boolean;
  entity: Entity;
};

type DurationTableCellProps = {
  status: runStatus;
  pipelineRun: PipelineRunResource;
};
const DurationTableCell = ({ status, pipelineRun }: DurationTableCellProps) => {
  if (status === runStatus.Pending) return '-';

  const startTime =
    typeof pipelineRun.status?.startTime === 'string'
      ? pipelineRun.status?.startTime
      : '';
  const completionTime =
    typeof pipelineRun.status?.completionTime === 'string'
      ? pipelineRun.status?.completionTime
      : '';
  return calculateDuration(startTime, completionTime);
};

export const PipelineRunItemRow = ({
  pipelineRun,
  hasSubcomponents,
  entity,
}: Props) => {
  const applicationName = getApplicationFromResource(pipelineRun);

  const status = pipelineRunStatus(pipelineRun);
  const commit = createCommitObjectFromPLR(pipelineRun);

  return (
    <TableRow>
      <TableCell>
        <ExternalLink
          to={getPipelineRunOverviewPath(
            pipelineRun.cluster.konfluxUI || '',
            pipelineRun.metadata?.namespace || '',
            applicationName || '',
            pipelineRun.metadata?.name || '',
          )}
          label={pipelineRun.metadata?.name || ''}
        />
      </TableCell>
      <TableCell>
        <Flex direction={{ default: 'row' }}>
          <StatusIconWithText status={status} />
        </Flex>
      </TableCell>
      <TableCell>
        {pipelineRun.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE]}
      </TableCell>
      {hasSubcomponents && (
        <SubcommponentLinkTableCell
          subcomponentName={pipelineRun?.subcomponent.name}
          entity={entity}
        />
      )}
      <TableCell>
        <Timestamp
          timestamp={
            typeof pipelineRun.status?.startTime === 'string'
              ? pipelineRun.status?.startTime
              : ''
          }
        />
      </TableCell>
      <TableCell>
        {commit?.eventType ? PipelineRunEventTypeLabel[commit.eventType] : '-'}
      </TableCell>
      <TableCell>
        <TriggerColumnData
          eventType={commit?.eventType}
          commitSha={commit?.sha}
          shaUrl={commit?.shaURL}
        />
      </TableCell>
      <TableCell>
        <DurationTableCell status={status} pipelineRun={pipelineRun} />
      </TableCell>
    </TableRow>
  );
};
