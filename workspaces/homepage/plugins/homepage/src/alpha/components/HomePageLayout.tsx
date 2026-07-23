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
import { useTranslation } from '../../hooks/useTranslation';
import { HeaderProps, Header } from '../../components/Header';
import { ReadOnlyGridLayout } from './ReadOnlyGirdLayout';
import { CustomizableGridLayout } from './CustomizableGridLayout';
import { HomePageCardConfig } from '../../types';

/**
 * Props for the NFS home page layout component.
 * @alpha
 */
export interface HomePageProps extends HeaderProps {
  widgets: HomePageCardConfig[];
  customizable: boolean;
}

/**
 * NFS home page layout that renders widgets in a read-only or customizable grid.
 * Used by the dynamic-homepage-layout extension.
 *
 * @alpha
 */
export const HomePageLayout = ({ widgets, customizable }: HomePageProps) => {
  const { t } = useTranslation();

  let content: React.ReactNode;
  if (widgets.length === 0) {
    content = <EmptyState title={t('homePage.empty')} missing="content" />;
  } else if (customizable) {
    content = <CustomizableGridLayout homepageCards={widgets} />;
  } else {
    content = <ReadOnlyGridLayout homepageCards={widgets} />;
  }

  return (
    <Page themeId="home">
      <Header title={t('header.welcome')} />
      <Content>{content}</Content>
    </Page>
  );
};
