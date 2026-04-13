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

import { HomePageLayoutBlueprint } from '@backstage/plugin-home-react/alpha';
import { HomePageLayout } from '../components/HomePageLayout';
import { HomePageCardConfig } from '../../types';

/**
 * Custom home page layout extension for the New Frontend System.
 *
 * Config-driven layout with `widgetLayout` (priority, breakpoints per widget),
 * supports both customizable (drag/drop) and read-only modes.
 *
 * @alpha
 */
export const homePageLayoutExtension =
  HomePageLayoutBlueprint.makeWithOverrides({
    name: 'dynamic-homepage-layout',
    config: {
      schema: {
        customizable: z => z.boolean().optional(),
        widgetLayout: z =>
          z
            .record(
              z.object({
                priority: z.number().optional(),
                breakpoints: z
                  .record(
                    z.object({
                      w: z.number().optional(),
                      h: z.number().optional(),
                      x: z.number().optional(),
                      y: z.number().optional(),
                    }),
                  )
                  .optional(),
              }),
            )
            .optional(),
      },
    },
    factory(originalFactory, { config }) {
      const customizable = config.customizable ?? true;
      const layoutConfig = config.widgetLayout ?? {};

      return originalFactory({
        loader: async () =>
          function CustomHomePageLayout({ widgets }) {
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
                if (customizable) return 0; // keep original order

                const priorityA = layoutConfig[a.name ?? '']?.priority ?? 0;
                const priorityB = layoutConfig[b.name ?? '']?.priority ?? 0;
                return priorityB - priorityA;
              });

            return (
              <HomePageLayout
                widgets={processedWidgets}
                customizable={customizable}
              />
            );
          },
      });
    },
  });
