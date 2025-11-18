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
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

import { ExternalLink } from '../../ExternalLink';
import {
  getApplicationOverviewPath,
  getApplicationsPath,
  getComponentOverviewPath,
  getNamespacesPath,
} from '../../../utils/url-paths';

type Props = {
  component: ComponentResource;
};

export const ComponentItemRow = ({ component }: Props) => {
  return (
    <TableRow>
      <TableCell>
        <ExternalLink
          to={getComponentOverviewPath(
            component.cluster.konfluxUI || '',
            component.metadata?.namespace || '',
            (component.spec?.application as string) || '',
            component.metadata?.name || '',
          )}
          label={component.metadata?.name || ''}
        />
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getApplicationOverviewPath(
            component.cluster.konfluxUI || '',
            component.metadata?.namespace || '',
            (component.spec?.application as string) || '',
          )}
          label={(component.spec?.application as string) || ''}
        />
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getNamespacesPath(component.cluster.konfluxUI || '')}
          label={component.cluster?.name || ''}
        />
      </TableCell>
      <TableCell>
        <ExternalLink
          to={getApplicationsPath(
            component.cluster.konfluxUI || '',
            component.metadata?.namespace || '',
          )}
          label={component.metadata?.namespace || ''}
        />
      </TableCell>
    </TableRow>
  );
};
