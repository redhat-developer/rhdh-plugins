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

import { HomePageLayoutProps } from '@backstage/plugin-home-react/alpha';

import { HomePageCardConfig } from '../../types';
import { HomePageLayout } from './HomePageLayout';

/**
 * Widget layout configuration keyed by widget name.
 * @alpha
 */
export type WidgetLayoutConfig = Record<
  string,
  {
    priority?: number;
    breakpoints?: Record<
      string,
      { w?: number; h?: number; x?: number; y?: number }
    >;
  }
>;

/**
 * Options for creating a config-driven home page layout component.
 * @alpha
 */
export interface CustomHomePageLayoutOptions {
  customizable: boolean;
  layoutConfig: WidgetLayoutConfig;
}

/**
 * Creates a home page layout component that applies widget layout config
 * (priority, breakpoints) before rendering the grid.
 *
 * @alpha
 */
export function createCustomHomePageLayout({
  customizable,
  layoutConfig,
}: CustomHomePageLayoutOptions) {
  return function CustomHomePageLayout({ widgets }: HomePageLayoutProps) {
    const processedWidgets: HomePageCardConfig[] = widgets
      .map(widget => {
        const widgetConfig = layoutConfig[widget.name ?? ''];
        const configBreakpoints = widgetConfig?.breakpoints;

        if (!configBreakpoints) return widget;

        return {
          ...widget,
          breakpointLayouts: configBreakpoints,
        };
      })
      .sort((a, b) => {
        if (customizable) return 0;

        const priorityA = layoutConfig[a.name ?? '']?.priority ?? 0;
        const priorityB = layoutConfig[b.name ?? '']?.priority ?? 0;
        return priorityB - priorityA;
      });

    return (
      <HomePageLayout widgets={processedWidgets} customizable={customizable} />
    );
  };
}
