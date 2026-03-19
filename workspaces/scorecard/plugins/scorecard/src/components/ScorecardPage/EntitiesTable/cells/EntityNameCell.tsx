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

import { Link } from '@backstage/core-components';
import { parseEntityRef } from '@backstage/catalog-model';
import { useRouteRef } from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

import Tooltip from '@mui/material/Tooltip';

interface EntityNameCellProps {
  entityRef: string;
  entityMetadata?: {
    title?: string;
    kind?: string;
    description?: string;
  };
}
export const EntityNameCell = ({
  entityRef,
  entityMetadata,
}: EntityNameCellProps) => {
  const entityLink = useRouteRef(entityRouteRef);

  const { kind, namespace, name } = parseEntityRef(entityRef);

  const displayName = entityMetadata?.title ?? name ?? '--';

  const tooltipTitle = [
    entityRef,
    entityMetadata?.kind ?? kind,
    entityMetadata?.description,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <Tooltip enterDelay={1500} title={tooltipTitle}>
      <Link
        to={entityLink({ kind, namespace, name })}
        style={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </Link>
    </Tooltip>
  );
};
