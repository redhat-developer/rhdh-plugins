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
import { ApplicationResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { ExternalLink } from '../../ExternalLink';
import {
  getApplicationOverviewPath,
  getApplicationsPath,
  getNamespacesPath,
} from '../../../utils/url-paths';

type Props = {
  application: ApplicationResource;
  hasSubcomponents: boolean;
  entity: Entity;
};

export const ApplicationItemRow = ({
  application,
  hasSubcomponents,
  entity,
}: Props) => {
  return (
    <TableRow>
      <TableCell>
        <ExternalLink
          to={getApplicationOverviewPath(
            application.cluster.konfluxUI || '',
            application.metadata?.namespace || '',
            application.metadata?.name || '',
          )}
          label={application.metadata?.name || ''}
        />
      </TableCell>
      {hasSubcomponents && (
        <SubcommponentLinkTableCell
          subcomponentName={application.subcomponent.name}
          entity={entity}
        />
      )}
      <TableCell>
        <ExternalLink
          to={getApplicationsPath(
            application.cluster.konfluxUI || '',
            application.metadata?.namespace || '',
          )}
          label={application.metadata?.namespace || ''}
        />
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getNamespacesPath(application.cluster.konfluxUI || '')}
          label={application.cluster.name || ''}
        />
      </TableCell>
    </TableRow>
  );
};
