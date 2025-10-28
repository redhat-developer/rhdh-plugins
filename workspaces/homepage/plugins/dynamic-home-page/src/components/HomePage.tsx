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

import { Content, EmptyState, Page } from '@backstage/core-components';

import { useTranslation } from '../hooks/useTranslation';
import { HomePageCardMountPoint } from '../types';
import { Header, HeaderProps } from './Header';
import { ReadOnlyGrid } from './ReadOnlyGrid';
import { CustomizableGrid } from './CustomizableGrid';

export interface HomePageProps extends HeaderProps {
  cardMountPoints: HomePageCardMountPoint[];
  customizable: boolean;
}

export const HomePage = ({
  cardMountPoints,
  customizable,
  ...otherProps
}: HomePageProps) => {
  const { t } = useTranslation();

  let content: React.ReactNode;
  if (cardMountPoints.length === 0) {
    content = <EmptyState title={t('homePage.empty')} missing="content" />;
  } else if (customizable) {
    content = <CustomizableGrid cardMountPoints={cardMountPoints} />;
  } else {
    content = <ReadOnlyGrid cardMountPoints={cardMountPoints} />;
  }

  return (
    <Page themeId="home">
      <Header title={t('header.welcome')} {...otherProps} />
      <Content>{content}</Content>
    </Page>
  );
};
