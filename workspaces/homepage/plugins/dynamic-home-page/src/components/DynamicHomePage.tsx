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

import React, { useMemo } from 'react';

import { Content, EmptyState, Header, Page } from '@backstage/core-components';

import { useHomePageMountPoints } from '../hooks/useHomePageMountPoints';
import { ReadOnlyGrid } from './ReadOnlyGrid';

/**
 * @public
 */
export interface DynamicHomePageProps {
  title?: string;
}

/**
 * @public
 */
export const DynamicHomePage = (props: DynamicHomePageProps) => {
  const allHomePageMountPoints = useHomePageMountPoints();

  const filteredAndSortedHomePageCards = useMemo(() => {
    if (!allHomePageMountPoints) {
      return [];
    }

    const filteredAndSorted = allHomePageMountPoints.filter(
      card =>
        card.enabled !== false &&
        (!card.config?.priority || card.config.priority >= 0),
    );

    filteredAndSorted.sort(
      (a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [allHomePageMountPoints]);

  return (
    <Page themeId="home">
      <Header title={props.title ?? 'Welcome back!'} />
      <Content>
        {filteredAndSortedHomePageCards.length === 0 ? (
          <EmptyState
            title="No home page cards (mount points) configured or found."
            missing="content"
          />
        ) : (
          <ReadOnlyGrid mountPoints={filteredAndSortedHomePageCards} />
        )}
      </Content>
    </Page>
  );
};
