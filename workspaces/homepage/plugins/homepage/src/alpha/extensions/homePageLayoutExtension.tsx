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
import { z } from 'zod';

const breakpointLayoutSchema = z.object({
  w: z.number().optional(),
  h: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

const widgetLayoutEntrySchema = z.object({
  priority: z.number().optional(),
  breakpoints: z.record(z.string(), breakpointLayoutSchema).optional(),
});

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
    configSchema: {
      customizable: z.boolean().optional(),
      widgetLayout: z.record(z.string(), widgetLayoutEntrySchema).optional(),
    },
    factory(originalFactory, { config }) {
      const customizable = config.customizable ?? true;
      const layoutConfig = config.widgetLayout ?? {};

      return originalFactory({
        loader: async () => {
          const { createCustomHomePageLayout } = await import(
            '../components/CustomHomePageLayout'
          );
          return createCustomHomePageLayout({ customizable, layoutConfig });
        },
      });
    },
  });
