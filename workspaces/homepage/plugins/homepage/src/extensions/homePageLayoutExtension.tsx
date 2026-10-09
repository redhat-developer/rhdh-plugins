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
import { homepageLayoutAttachTo } from './homepageAttach';
import { widgetLayoutSchema } from '../utils/widgetLayoutConfig';

/**
 * Custom home page layout for `page:homepage` only.
 *
 * Applies persona-based `homepage.defaultWidgets` filtering via HomePageLayout
 * (homepage-backend). Community `page:home` keeps the upstream default layout.
 */
export const homePageLayoutExtension =
  HomePageLayoutBlueprint.makeWithOverrides({
    name: 'dynamic-homepage-layout',
    attachTo: homepageLayoutAttachTo,
    configSchema: {
      customizable: z.boolean().optional(),
      widgetLayout: widgetLayoutSchema,
    },
    factory(originalFactory, { config }) {
      const customizable = config.customizable ?? true;
      const widgetLayout = config.widgetLayout ?? {};

      return originalFactory({
        loader: async () => {
          const { HomePageLayout } = await import(
            '../components/HomePageLayout'
          );

          return function CustomHomePageLayout({ widgets }) {
            return (
              <HomePageLayout
                widgets={widgets}
                customizable={customizable}
                widgetLayout={widgetLayout}
              />
            );
          };
        },
      });
    },
  });
