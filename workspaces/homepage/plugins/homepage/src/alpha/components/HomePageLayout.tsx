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

import { cloneElement, useMemo } from 'react';

import {
  Content,
  EmptyState,
  Page,
  Progress,
} from '@backstage/core-components';
import { useTranslation } from '../../hooks/useTranslation';
import { useDefaultWidgets } from '../../hooks/useDefaultWidgets';
import { HeaderProps, Header } from '../../components/Header';
import { HomePageStylesProvider } from '../../components/HomePageStylesProvider';
import { ReadOnlyGridLayout } from './ReadOnlyGirdLayout';
import { CustomizableGridLayout } from './CustomizableGridLayout';
import { HomePageCardConfig } from '../../types';
import type { Breakpoint, Layout } from '../../types';

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
 * Loads persona-based default widgets from the homepage-backend and merges them
 * with extension-provided widgets.
 *
 * @alpha
 */
export const HomePageLayout = ({ widgets, customizable }: HomePageProps) => {
  const { t } = useTranslation();
  const { defaultWidgets, loading } = useDefaultWidgets();

  const mergedWidgets = useMemo((): HomePageCardConfig[] | undefined => {
    if (!defaultWidgets) {
      return undefined;
    }

    const widgetsByRef = new Map<string, HomePageCardConfig>();
    for (const widget of widgets) {
      const extensionId = widget.node?.spec?.id ?? '';
      const refName = extensionId.split('/').pop() ?? '';
      if (refName) {
        widgetsByRef.set(refName, widget);
      }
    }

    const result: HomePageCardConfig[] = [];
    for (const defaultWidget of defaultWidgets) {
      const widget = widgetsByRef.get(defaultWidget.ref);
      if (!widget) {
        // eslint-disable-next-line no-console
        console.warn(
          `Homepage default widget has invalid ref "${defaultWidget.ref}". ` +
            `No matching NFS widget found. Available widgets: ${[...widgetsByRef.keys()].join(', ')}`,
        );
        continue;
      }

      const widgetLayout = defaultWidget.layout as
        | Record<string, { x?: number; y?: number; w?: number; h?: number }>
        | undefined;

      const component =
        defaultWidget.props && widget.component
          ? cloneElement(widget.component, defaultWidget.props)
          : widget.component;

      result.push({
        ...widget,
        name: defaultWidget.id,
        component,
        breakpointLayouts: widgetLayout as
          | Record<Breakpoint, Layout>
          | undefined,
      });
    }
    return result;
  }, [defaultWidgets, widgets]);

  let content: React.ReactNode;
  if (loading) {
    content = <Progress />;
  } else if (mergedWidgets) {
    if (mergedWidgets.length === 0) {
      content = <EmptyState title={t('homePage.empty')} missing="content" />;
    } else if (customizable) {
      content = <CustomizableGridLayout homepageCards={mergedWidgets} />;
    } else {
      content = <ReadOnlyGridLayout homepageCards={mergedWidgets} />;
    }
  } else if (widgets.length === 0) {
    content = <EmptyState title={t('homePage.empty')} missing="content" />;
  } else if (customizable) {
    content = <CustomizableGridLayout homepageCards={widgets} />;
  } else {
    content = <ReadOnlyGridLayout homepageCards={widgets} />;
  }

  return (
    <HomePageStylesProvider>
      <Page themeId="home">
        <Header title={t('header.welcome')} />
        <Content>{content}</Content>
      </Page>
    </HomePageStylesProvider>
  );
};
