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

/**
 * Custom home page layout extension for the New Frontend System.
 *
 * Supports both customizable (drag/drop) and read-only modes.
 * Default widgets (including persona-based filtering) are loaded from the
 * homepage-backend via the defaultWidgetsApi.
 *
 * @alpha
 */
export const homePageLayoutExtension =
  HomePageLayoutBlueprint.makeWithOverrides({
    name: 'dynamic-homepage-layout',
    config: {
      schema: {
        customizable: z => z.boolean().optional(),
      },
    },
    factory(originalFactory, { config }) {
      const customizable = config.customizable ?? true;

      return originalFactory({
        loader: async () =>
          function CustomHomePageLayout({ widgets }) {
            return (
              <HomePageLayout widgets={widgets} customizable={customizable} />
            );
          },
      });
    },
  });
