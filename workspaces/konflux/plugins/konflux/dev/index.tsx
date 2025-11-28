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
import { Entity } from '@backstage/catalog-model';
import { Page, Header, TabbedLayout } from '@backstage/core-components';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';

import { konfluxPlugin, KonfluxPage, KonfluxCIPage } from '../src/plugin';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'konflux-demo-service',
    description: 'A demo service for Konflux CI/CD pipeline',
    annotations: {
      'backstage.io/kubernetes-id': 'konflux-demo',
      'backstage.io/kubernetes-namespace': 'konflux-system',
      'tekton.dev/cicd': 'true',
      'konflux.dev/cluster': 'minikube-cluster1',
      'konflux.dev/environment': 'development',
    },
    labels: {
      'app.kubernetes.io/name': 'konflux-demo',
      'app.kubernetes.io/component': 'frontend',
      'konflux.dev/team': 'platform-team',
    },
  },
  spec: {
    lifecycle: 'experimental',
    type: 'service',
    owner: 'team:platform-team',
    system: 'konflux-platform',
  },
};

createDevApp()
  .addPage({
    element: (
      <EntityProvider entity={mockEntity}>
        <Page themeId="service">
          <Header type="component — service" title="Konflux Demo" />
          <TabbedLayout>
            <TabbedLayout.Route path="/konflux-ci" title="CI/CD">
              <KonfluxCIPage />
            </TabbedLayout.Route>
            <TabbedLayout.Route path="/konflux" title="Konflux">
              <KonfluxPage />
            </TabbedLayout.Route>
          </TabbedLayout>
        </Page>
      </EntityProvider>
    ),
    title: 'Konflux CI',
    path: '/konflux',
  })
  .registerPlugin(konfluxPlugin)
  .render();
