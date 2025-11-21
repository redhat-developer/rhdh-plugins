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

import {
  getApplicationFromResource,
  ReleaseResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { useReleaseStatus } from '../../../hooks/useReleaseStatus';
import { TableCell, TableRow } from '@material-ui/core';
import { SubcommponentLinkTableCell } from '../../Table/SubcomponentLinkTableCell';
import { Timestamp } from '../../Timestamp/Timestamp';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { Flex } from '@patternfly/react-core';

import { ExternalLink } from '../../ExternalLink';
import {
  getApplicationOverviewPath,
  getReleaseOverviewPath,
} from '../../../utils/url-paths';

type Props = {
  release: ReleaseResource | null;
  entity: Entity;
  hasSubcomponents: boolean;
};

export const LatestReleaseItemRow = ({
  release,
  entity,
  hasSubcomponents,
}: Props) => {
  const releaseStatus = useReleaseStatus(release);

  if (!release) return null;

  const applicationName = getApplicationFromResource(release) || '-';

  return (
    <TableRow>
      {hasSubcomponents && (
        <SubcommponentLinkTableCell
          subcomponentName={release?.subcomponent.name}
          entity={entity}
        />
      )}
      <TableCell>
        <ExternalLink
          to={getApplicationOverviewPath(
            release.cluster.konfluxUI || '',
            release.metadata?.namespace || '',
            applicationName,
          )}
          label={applicationName}
        />
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getReleaseOverviewPath(
            release.cluster.konfluxUI || '',
            release.metadata?.namespace || '',
            applicationName,
            release.metadata?.name || '',
          )}
          label={release.metadata?.name || ''}
        />
      </TableCell>

      <TableCell>
        <Timestamp timestamp={release.metadata?.creationTimestamp ?? ''} />
      </TableCell>
      <TableCell>
        <Flex flex={{ default: 'flex_1' }} direction={{ default: 'row' }}>
          <StatusIconWithText status={releaseStatus} />
        </Flex>
      </TableCell>
    </TableRow>
  );
};
