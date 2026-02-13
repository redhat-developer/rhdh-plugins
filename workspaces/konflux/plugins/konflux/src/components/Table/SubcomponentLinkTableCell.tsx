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

import { useMemo } from 'react';
import { useEntitySubcomponents } from '../../hooks/useEntitySubcomponents';
import { TableCell } from '@material-ui/core';
import { Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { getBackstageEntityOverviewPath } from '../../utils/url-paths';

type SubcommponentLinkTableCellProps = {
  subcomponentName?: string;
  entity: Entity;
};

export const SubcommponentLinkTableCell = ({
  subcomponentName,
  entity,
}: SubcommponentLinkTableCellProps) => {
  const { subcomponentEntities } = useEntitySubcomponents(entity);
  const currentEntity = useMemo(
    () => subcomponentEntities?.find(e => e.metadata.name === subcomponentName),
    [subcomponentName, subcomponentEntities],
  );

  if (!subcomponentName || !currentEntity) {
    return <TableCell>-</TableCell>;
  }

  return (
    <TableCell data-testid="subcomponent-link-table-cell">
      <Link to={getBackstageEntityOverviewPath(currentEntity)}>
        {currentEntity.metadata?.title || subcomponentName}
      </Link>
    </TableCell>
  );
};
