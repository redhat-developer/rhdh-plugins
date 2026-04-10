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

import { memo } from 'react';

import { Link } from '@backstage/core-components';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  entityRouteRef,
  useEntityPresentation,
} from '@backstage/plugin-catalog-react';

import Tooltip from '@mui/material/Tooltip';

export const OwnerCell = memo(({ ownerRef }: { ownerRef?: string }) => {
  const entityLink = useRouteRef(entityRouteRef);

  const parsedEntityRef = ownerRef
    ? parseEntityRef(ownerRef, {
        defaultKind: 'group',
        defaultNamespace: 'default',
      })
    : null;
  const stringifiedEntityRef = parsedEntityRef
    ? stringifyEntityRef(parsedEntityRef)
    : '';
  const { primaryTitle, secondaryTitle } =
    useEntityPresentation(stringifiedEntityRef);

  if (!ownerRef) return <>--</>;

  const link = entityLink(parsedEntityRef!);

  return (
    <Tooltip enterDelay={1500} title={secondaryTitle ?? stringifiedEntityRef}>
      <Link
        to={link}
        style={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {primaryTitle}
      </Link>
    </Tooltip>
  );
});
