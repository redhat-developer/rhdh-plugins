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
import { Container, Flex } from '@backstage/ui';
import CircularProgress from '@mui/material/CircularProgress';
import { useCatalogEntities } from './useCatalogEntities';
import type { EmptyStateProps } from '../components/empty-state/EmptyState';
import { EmptyState } from '../components/empty-state/EmptyState';

/**
 * Renders children when catalog entities matching the filter exist,
 * or an empty state when none are found.
 *
 * @internal
 */
export function EmptyCatalogGate(props: {
  filter?: EntityFilterQuery;
  emptyState: EmptyStateProps;
  children: React.ReactNode;
}) {
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
    return (
      <Container my="4">
        <EmptyState {...props.emptyState} />
      </Container>
    );
  }

  return <>{props.children}</>;
}
