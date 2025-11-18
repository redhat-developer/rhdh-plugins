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
import { Link } from '@backstage/core-components';
import { CodeBranchIcon } from '@patternfly/react-icons/dist/esm/icons/code-branch-icon';
import { Flex, FlexItem } from '@patternfly/react-core';
import { TableCell, TableRow } from '@material-ui/core';
import { SubcommponentLinkTableCell } from '../../Table/SubcomponentLinkTableCell';
import {
  getApplicationFromResource,
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { Timestamp } from '../../Timestamp/Timestamp';
import { Commit, pipelineRunStatus } from '../../../utils/pipeline-runs';
import CommitLabel from './CommitLabel';
import {
  createRepoBranchURL,
  getCommitSha,
  statuses,
} from '../../../utils/commits';
import { ExternalLink } from '../../ExternalLink';
import { useMemo } from 'react';
import {
  getApplicationOverviewPath,
  getCommitOverviewPath,
} from '../../../utils/url-paths';

type Props = {
  commit: Commit;
  pipelineRuns: PipelineRunResource[];
  entity: Entity;
  hasSubcomponents: boolean;
};

export const CommitItemRow = ({
  commit,
  pipelineRuns,
  entity,
  hasSubcomponents,
}: Props) => {
  const prNumber = commit.isPullRequest ? `#${commit.pullRequestNumber}` : '';
  const repoBranchUrl = createRepoBranchURL(commit);

  const status = useMemo<runStatus>(() => {
    const plrsForCommit = pipelineRuns
      ?.filter(plr => {
        const applicationName = getApplicationFromResource(plr);
        return (
          getCommitSha(plr) === commit.sha &&
          applicationName === commit.application
        );
      })
      ?.sort(
        (a, b) =>
          new Date((b.status?.startTime as string) || '').getTime() -
          new Date((a.status?.startTime as string) || '').getTime(),
      );

    const plrStatus = pipelineRunStatus(plrsForCommit?.[0]);
    if (statuses.includes(plrStatus)) {
      return plrStatus;
    }
    return runStatus.Unknown;
  }, [commit.application, commit.sha, pipelineRuns]);

  return (
    <TableRow>
      <TableCell>
        <Flex
          direction={{ default: 'row' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <CodeBranchIcon />
          </FlexItem>

          <FlexItem>
            <Link
              to={getCommitOverviewPath(
                commit.cluster.konfluxUI || '',
                commit.metadata?.namespace || '',
                commit.application || '',
                commit.sha || '',
              )}
            >
              {prNumber} {commit.shaTitle}
            </Link>
          </FlexItem>
          {commit.shaURL && (
            <FlexItem>
              <CommitLabel
                gitProvider={commit.gitProvider}
                sha={commit.sha}
                shaURL={commit.shaURL}
              />
            </FlexItem>
          )}
        </Flex>
      </TableCell>
      <TableCell>
        <Flex direction={{ default: 'row' }} flexWrap={{ default: 'nowrap' }}>
          <StatusIconWithText status={status} />
        </Flex>
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getApplicationOverviewPath(
            commit.cluster.konfluxUI || '',
            commit.metadata?.namespace || '',
            commit.application || '',
          )}
          label={commit.application || ''}
        />
      </TableCell>
      {hasSubcomponents && (
        <SubcommponentLinkTableCell
          subcomponentName={commit.subcomponent.name}
          entity={entity}
        />
      )}
      <TableCell>
        <Timestamp
          timestamp={
            typeof commit.status?.startTime === 'string'
              ? commit.status?.startTime
              : ''
          }
        />
      </TableCell>
      <TableCell>
        {repoBranchUrl ? (
          <ExternalLink to={repoBranchUrl} label={commit.branch || ''} />
        ) : (
          `${commit.branch || '-'}`
        )}
      </TableCell>
    </TableRow>
  );
};
