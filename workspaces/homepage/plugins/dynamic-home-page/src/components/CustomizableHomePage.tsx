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

import { Content, EmptyState, Page } from '@backstage/core-components';

import { HomePageCardMountPoint } from '../types';
import { useTranslation } from '../hooks/useTranslation';

import { Header, HeaderProps } from './Header';
import { CustomizableGrid } from './CustomizableGrid';

export interface HomePageProps extends HeaderProps {
  cards?: HomePageCardMountPoint[];
}

export const CustomizableHomePage = (props: HomePageProps) => {
  const { t } = useTranslation();
  const filteredAndSortedHomePageCards = useMemo(() => {
    if (!props.cards) {
      return [];
    }

    const filteredAndSorted = props.cards.filter(
      card =>
        card.enabled !== false &&
        (!card.config?.priority || card.config.priority >= 0),
    );

    filteredAndSorted.sort(
      (a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [props.cards]);

  return (
    <Page themeId="home">
      <Header {...props} />
      <Content>
        {filteredAndSortedHomePageCards.length === 0 ? (
          <EmptyState title={t('homePage.empty')} missing="content" />
        ) : (
          <CustomizableGrid mountPoints={filteredAndSortedHomePageCards} />
        )}
      </Content>
    </Page>
  );
};
