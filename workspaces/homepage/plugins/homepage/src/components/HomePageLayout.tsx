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

import {
  Content,
  EmptyState,
  Page,
  Progress,
} from '@backstage/core-components';
import { useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDefaultWidgets } from '../legacy/hooks/useDefaultWidgets';
import { HeaderProps, Header } from './Header';
import { ReadOnlyGridLayout } from './ReadOnlyGridLayout';
import { CustomizableGridLayout } from './CustomizableGridLayout';
import { HomePageCardConfig } from '../types';
import { applyDefaultWidgetsToNfsWidgets } from './applyDefaultWidgets';

/**
 * Props for the NFS home page layout component.
 */
export interface HomePageProps extends HeaderProps {
  widgets: HomePageCardConfig[];
  customizable?: boolean;
}

/**
 * NFS home page layout that renders widgets in a read-only or customizable grid.
 *
 * When `homepage.defaultWidgets` is available from the backend, applies the same
 * persona / RBAC filtering as the legacy homepage (`if` / `unless` / `tags`).
 */
export const HomePageLayout = ({
  widgets,
  customizable = true,
}: HomePageProps) => {
  const { t } = useTranslation();
  const { defaultWidgets, loading } = useDefaultWidgets();

  const visibleWidgets = useMemo(() => {
    if (!defaultWidgets) {
      return widgets;
    }
    return applyDefaultWidgetsToNfsWidgets(widgets, defaultWidgets);
  }, [widgets, defaultWidgets]);

  let content: React.ReactNode;
  if (loading) {
    content = <Progress />;
  } else if (visibleWidgets.length === 0) {
    content = <EmptyState title={t('homePage.empty')} missing="content" />;
  } else if (customizable) {
    content = <CustomizableGridLayout homepageCards={visibleWidgets} />;
  } else {
    content = <ReadOnlyGridLayout homepageCards={visibleWidgets} />;
  }

  return (
    <Page themeId="home">
      <Header title={t('header.welcome')} />
      <Content>{content}</Content>
    </Page>
  );
};
