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

import type { EntityFilterQuery } from '@backstage/catalog-client';
import { ErrorPanel } from '@backstage/core-components';
import { useRouteRef } from '@backstage/frontend-plugin-api';
import catalogImportPlugin from '@backstage/plugin-catalog-import/alpha';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { usePermission } from '@backstage/plugin-permission-react';
import { ButtonLink, Container, Flex } from '@backstage/ui';
import CircularProgress from '@mui/material/CircularProgress';
import { useCatalogEntities } from './useCatalogEntities';
import { EmptyState } from '../components/empty-state/EmptyState';

/**
 * @internal
 */
export interface EmptyCatalogStateProps {
  title: string;
  description: string;
  importButtonTitle?: string;
}

/**
 * Renders the catalog empty state. The import button is only shown when the
 * `page:catalog-import` extension is installed (its route also provides the
 * button href) and the user is allowed to create catalog entities.
 *
 * The route and permission hooks live here so they only run when the empty
 * state is actually rendered.
 */
function CatalogEmptyState(props: Readonly<EmptyCatalogStateProps>) {
  const { title, description, importButtonTitle } = props;

  const catalogImportRoute = useRouteRef(catalogImportPlugin.routes.importPage);
  const { allowed: canImport } = usePermission({
    permission: catalogEntityCreatePermission,
  });

  const showImportButton =
    Boolean(importButtonTitle) && Boolean(catalogImportRoute) && canImport;

  return (
    <Container my="4">
      <EmptyState
        title={title}
        description={description}
        action={
          showImportButton ? (
            <ButtonLink href={catalogImportRoute!()} variant="primary">
              {importButtonTitle}
            </ButtonLink>
          ) : undefined
        }
      />
    </Container>
  );
}

/**
 * Renders children when catalog entities matching the filter exist,
 * or an empty state when none are found.
 *
 * @internal
 */
export function EmptyCatalogGate(
  props: Readonly<{
    filter?: EntityFilterQuery;
    emptyState: EmptyCatalogStateProps;
    children: React.ReactNode;
  }>,
) {
  const state = useCatalogEntities(props.filter);

  if (state.status === 'loading') {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '50vh' }}>
        <CircularProgress />
      </Flex>
    );
  }

  if (state.status === 'error') {
    return (
      <Container my="4">
        <ErrorPanel error={state.error} />
      </Container>
    );
  }

  if (!state.hasEntities) {
    return <CatalogEmptyState {...props.emptyState} />;
  }

  return <>{props.children}</>;
}
