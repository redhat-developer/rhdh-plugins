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
  createExtensionInput,
  createRouteRef,
  ExtensionBoundary,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import {
  homePageLayoutComponentDataRef,
  homePageWidgetDataRef,
  HomePageLayoutBlueprint,
} from '@backstage/plugin-home-react/alpha';
import HomeIcon from '@mui/icons-material/Home';
import { lazy } from 'react';

/**
 * Route ref for the homepage-owned NFS page.
 *
 * @alpha
 */
export const homepageRouteRef = createRouteRef();

/**
 * Homepage page (`page:homepage`) with configurable `path`.
 *
 * Owns widgets/layout inputs so this plugin works without community
 * `@backstage/plugin-home`. Disable independently via app-config:
 * `page:homepage: false` or `page:home: false`.
 *
 * @alpha
 */
export const homepagePage = PageBlueprint.makeWithOverrides({
  inputs: {
    widgets: createExtensionInput([homePageWidgetDataRef]),
    layout: createExtensionInput([HomePageLayoutBlueprint.dataRefs.component], {
      singleton: true,
      optional: true,
      internal: true,
    }),
  },
  factory(originalFactory, { node, inputs }) {
    return originalFactory({
      path: '/',
      noHeader: true,
      routeRef: homepageRouteRef,
      title: 'Home',
      icon: <HomeIcon fontSize="inherit" />,
      loader: async () => {
        const LazyDefaultLayout = lazy(() =>
          import('../components/HomePageLayout').then(m => ({
            default: m.HomePageLayout,
          })),
        );

        const DefaultLayoutComponent = (props: { widgets: unknown[] }) => (
          <ExtensionBoundary node={node}>
            <LazyDefaultLayout widgets={props.widgets as never} customizable />
          </ExtensionBoundary>
        );

        const Layout =
          inputs.layout?.get(homePageLayoutComponentDataRef) ??
          DefaultLayoutComponent;

        const widgets = inputs.widgets.map(widget => ({
          ...widget.get(homePageWidgetDataRef),
          node: widget.node,
        }));

        return <Layout widgets={widgets} />;
      },
    });
  },
});
